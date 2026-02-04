import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: PageServerLoad = async ({ params, url }) => {
  const { code } = params;
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const search = url.searchParams.get('search') || '';
  const themeSlug = url.searchParams.get('theme') || '';
  const offset = (page - 1) * limit;
  
  try {
    const db = await connectDB();
    
    // Construire la requête avec les filtres
    let whereClause = 'WHERE subject.code = $code';
    const queryParams: Record<string, any> = { code, limit, offset };
    
    if (search) {
      whereClause += ' AND (question CONTAINS $search OR explanation CONTAINS $search)';
      queryParams.search = search;
    }
    
    if (themeSlug) {
      whereClause += ' AND theme.slug = $themeSlug';
      queryParams.themeSlug = themeSlug;
    }
    
    // Récupérer les questions
    const questionsResult = await db.query<any[]>(`
      SELECT 
        id,
        question,
        type,
        difficulty,
        is_active,
        theme.name AS theme_name,
        theme.slug AS theme_slug,
        created_at
      FROM question 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $limit START $offset
    `, queryParams);
    
    // Compter le total
    const countResult = await db.query<any[]>(`
      SELECT count() FROM question ${whereClause} GROUP ALL
    `, queryParams);
    
    const questions = (questionsResult[0] as any[])?.map((q: any) => ({
      id: q.id?.toString(),
      question: q.question,
      type: q.type,
      difficulty: q.difficulty,
      is_active: q.is_active,
      theme_name: q.theme_name,
      theme_slug: q.theme_slug,
      created_at: q.created_at
    })) || [];
    
    const total = (countResult[0] as any[])?.[0]?.count || 0;
    
    return {
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        search,
        themeSlug
      }
    };
  } catch (err) {
    console.error('Error loading questions:', err);
    return {
      questions: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      filters: { search: '', themeSlug: '' }
    };
  }
};
