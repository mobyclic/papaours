import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: PageServerLoad = async ({ url }) => {
  const db = await connectDB();
  
  // Paramètres de pagination et filtres depuis l'URL
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
  const search = url.searchParams.get('search') || '';
  const questionType = url.searchParams.get('type') || '';
  const difficulty = url.searchParams.get('difficulty') || '';
  const matiereId = url.searchParams.get('matiere') || '';
  const themeId = url.searchParams.get('theme') || '';
  const isActive = url.searchParams.get('active'); // null = all, 'true' = active, 'false' = inactive
  const sortColumn = url.searchParams.get('sort') || 'createdAt';
  const sortDirection = url.searchParams.get('dir') || 'desc';
  
  // Construire les conditions WHERE
  const conditions: string[] = [];
  const params: Record<string, any> = {};
  
  if (search) {
    conditions.push('(string::lowercase(question) CONTAINS string::lowercase($search) OR string::lowercase(explanation) CONTAINS string::lowercase($search))');
    params.search = search;
  }
  
  if (questionType) {
    conditions.push('questionType = $questionType');
    params.questionType = questionType;
  }
  
  if (difficulty) {
    conditions.push('difficulty = $difficulty');
    params.difficulty = difficulty;
  }
  
  if (matiereId) {
    conditions.push('matiere_id = type::thing("matiere", $matiereId)');
    params.matiereId = matiereId;
  }
  
  if (themeId) {
    conditions.push('type::thing("theme", $themeId) INSIDE theme_ids');
    params.themeId = themeId;
  }
  
  if (isActive !== null && isActive !== '') {
    conditions.push('isActive = $isActive');
    params.isActive = isActive === 'true';
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // Valider le tri
  const allowedSortColumns = ['question', 'questionType', 'difficulty', 'isActive', 'createdAt', 'updatedAt'];
  const safeSortColumn = allowedSortColumns.includes(sortColumn) ? sortColumn : 'createdAt';
  const safeSortDirection = sortDirection === 'asc' ? 'ASC' : 'DESC';
  
  // Compter le total
  const countQuery = `SELECT count() as total FROM question ${whereClause} GROUP ALL`;
  const countResult = await db.query(countQuery, params);
  const total = (countResult[0] as any[])?.[0]?.total || 0;
  
  // Récupérer les questions avec pagination
  const offset = (page - 1) * pageSize;
  const questionsQuery = `
    SELECT 
      *,
      matiere_id.name as matiere_name,
      matiere_id.slug as matiere_slug
    FROM question 
    ${whereClause}
    ORDER BY ${safeSortColumn} ${safeSortDirection}
    LIMIT $pageSize
    START $offset
  `;
  
  const questionsResult = await db.query(questionsQuery, { ...params, pageSize, offset });
  const questions = ((questionsResult[0] as any[]) || []).map(q => ({
    id: q.id?.toString() || q.id,
    question: q.question,
    questionType: q.questionType || 'qcm',
    difficulty: q.difficulty || 'medium',
    isActive: q.isActive ?? true,
    imageUrl: q.imageUrl,
    options: q.options || [],
    optionImages: q.optionImages || [],
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    matiere_id: q.matiere_id?.toString(),
    matiere_name: q.matiere_name,
    theme_ids: (q.theme_ids || []).map((t: any) => t?.toString()),
    createdAt: q.createdAt,
    updatedAt: q.updatedAt
  }));
  
  // Récupérer les thèmes pour chaque question (pour affichage)
  const themeIds = new Set<string>();
  questions.forEach(q => {
    (q.theme_ids || []).forEach((tid: string) => {
      if (tid) themeIds.add(tid.split(':')[1] || tid);
    });
  });
  
  let themesMap: Record<string, string> = {};
  if (themeIds.size > 0) {
    const themeIdsArray = Array.from(themeIds);
    const themesQuery = `SELECT id, name FROM theme WHERE id INSIDE [${themeIdsArray.map(id => `theme:${id}`).join(', ')}]`;
    const themesResult = await db.query(themesQuery);
    ((themesResult[0] as any[]) || []).forEach(t => {
      themesMap[t.id?.toString()] = t.name;
    });
  }
  
  // Charger les matières pour les filtres
  const matieresResult = await db.query('SELECT id, name, slug FROM matiere ORDER BY name');
  const matieres = ((matieresResult[0] as any[]) || []).map(m => ({
    id: m.id?.toString()?.split(':')[1] || m.id,
    name: m.name,
    slug: m.slug
  }));
  
  // Charger tous les thèmes pour les filtres
  const allThemesResult = await db.query(`
    SELECT id, name, matiere_ids FROM theme ORDER BY name
  `);
  const themes = ((allThemesResult[0] as any[]) || []).map(t => ({
    id: t.id?.toString()?.split(':')[1] || t.id,
    name: t.name,
    matiere_ids: (t.matiere_ids || []).map((m: any) => m?.toString()?.split(':')[1] || m)
  }));

  // Charger tous les grades pour le générateur IA
  const gradesResult = await db.query('SELECT id, name, code FROM grade ORDER BY `order`');
  const grades = ((gradesResult[0] as any[]) || []).map(g => ({
    id: g.id?.toString()?.split(':')[1] || g.id,
    name: g.name,
    code: g.code
  }));
  
  // Stats rapides
  const statsResult = await db.query(`
    SELECT 
      count() as total,
      count(IF isActive = true THEN 1 ELSE NONE END) as active,
      count(IF questionType = 'qcm' THEN 1 ELSE NONE END) as qcm,
      count(IF questionType = 'qcm_image' THEN 1 ELSE NONE END) as qcm_image
    FROM question GROUP ALL
  `);
  const stats = (statsResult[0] as any[])?.[0] || { total: 0, active: 0, qcm: 0, qcm_image: 0 };
  
  return {
    questions,
    themesMap,
    matieres,
    themes,
    grades,
    stats,
    total,
    page,
    pageSize,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    },
    filters: {
      search,
      type: questionType,
      difficulty,
      matiere: matiereId,
      theme: themeId,
      active: isActive ?? '',
      sort: safeSortColumn,
      dir: sortDirection
    }
  };
};
