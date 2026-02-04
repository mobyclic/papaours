import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const db = await connectDB();
    
    // Paramètres de filtrage (support ancien param "matiere" et nouveau "subject")
    const subject = url.searchParams.get('subject') || url.searchParams.get('matiere');
    const theme = url.searchParams.get('theme');
    const grade = url.searchParams.get('grade') || url.searchParams.get('classe');
    const difficulty = url.searchParams.get('difficulty');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Construction de la requête dynamique
    let conditions: string[] = ['isActive = true'];
    const params: Record<string, unknown> = {};

    if (subject) {
      // Utiliser subject (nouveau) au lieu de matiere_id
      conditions.push('subject.code = $subjectCode');
      params.subjectCode = subject.includes(':') ? subject.split(':')[1] : subject;
    }

    if (theme) {
      conditions.push('type::thing("theme", $themeId) INSIDE theme_ids');
      params.themeId = theme.includes(':') ? theme.split(':')[1] : theme;
    }

    if (grade) {
      conditions.push('type::thing("grade", $gradeId) INSIDE target_grades');
      params.gradeId = grade.includes(':') ? grade.split(':')[1] : grade;
    }

    if (difficulty) {
      conditions.push('difficulty_level = $difficulty');
      params.difficulty = parseInt(difficulty);
    }

    if (search) {
      conditions.push('(string::lowercase(title) CONTAINS string::lowercase($search) OR string::lowercase(description) CONTAINS string::lowercase($search))');
      params.search = search;
    }

    // Requête quiz avec comptage
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const quizQuery = `
      SELECT 
        id, title, slug, description, coverImage, 
        difficulty_level, questionType, maxQuestions,
        subject, subject.code as subject_code, subject.name as subject_name, 
        subject.color as subject_color, subject.icon as subject_icon,
        theme_ids, theme_ids.*.name as theme_names,
        target_grades, target_grades.*.name as grade_names,
        createdAt
      FROM quiz 
      ${whereClause}
      ORDER BY subject_name ASC, title ASC
      LIMIT $limit START $offset
    `;
    
    params.limit = limit;
    params.offset = offset;

    const quizzesResult = await db.query<any[]>(quizQuery, params);
    const quizzes = (quizzesResult[0] || []).map((q: any) => ({
      id: q.id?.toString() || q.id,
      title: q.title,
      slug: q.slug,
      description: q.description,
      coverImage: q.coverImage,
      difficulty_level: q.difficulty_level || 1,
      questionType: q.questionType || 'qcm',
      maxQuestions: q.maxQuestions,
      subject: q.subject_name ? {
        id: q.subject?.toString(),
        code: q.subject_code,
        name: q.subject_name,
        color: q.subject_color,
        icon: q.subject_icon
      } : null,
      themes: (q.theme_names || []).filter(Boolean),
      grades: (q.grade_names || []).filter(Boolean),
      createdAt: q.createdAt
    }));

    // Compter le total
    const countQuery = `SELECT count() FROM quiz ${whereClause} GROUP ALL`;
    const countResult = await db.query<any[]>(countQuery, params);
    const total = (countResult[0] as any[])?.[0]?.count || 0;

    // Récupérer les filtres disponibles - utiliser subject au lieu de matiere
    const [subjectsResult, themesResult, gradesResult] = await Promise.all([
      db.query<any[]>('SELECT id, code, name, icon, color, domain FROM subject WHERE is_active = true ORDER BY name ASC'),
      db.query<any[]>('SELECT id, name, slug, subject.code as subject_code FROM theme WHERE is_active = true ORDER BY name ASC'),
      db.query<any[]>('SELECT id, name, code, `order` FROM grade ORDER BY `order` ASC')
    ]);

    const subjects = (subjectsResult[0] || []).map((s: any) => ({
      id: s.code,
      code: s.code,
      name: s.name,
      icon: s.icon,
      color: s.color
    }));

    const themes = (themesResult[0] || []).map((t: any) => ({
      id: t.id?.toString()?.split(':')[1] || t.id,
      name: t.name,
      slug: t.slug,
      subject_code: t.subject_code || null
    }));

    const grades = (gradesResult[0] || []).map((g: any) => ({
      id: g.id?.toString()?.split(':')[1] || g.id,
      name: g.name,
      code: g.code,
      order: g.order
    }));

    return json({
      quizzes,
      total,
      limit,
      offset,
      filters: {
        subjects,
        themes,
        grades
      }
    });
  } catch (error) {
    console.error('Explore quizzes error:', error);
    return json({ 
      quizzes: [], 
      total: 0, 
      limit: 50, 
      offset: 0,
      filters: { matieres: [], themes: [], grades: [] },
      error: 'Erreur lors du chargement des quiz'
    }, { status: 500 });
  }
};
