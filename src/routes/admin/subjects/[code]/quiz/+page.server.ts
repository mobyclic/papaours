import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: PageServerLoad = async ({ params }) => {
  const { code } = params;
  
  try {
    const db = await connectDB();
    
    // Récupérer les quiz de ce subject
    const quizResult = await db.query<any[]>(`
      SELECT 
        id,
        title,
        slug,
        description,
        difficulty,
        isActive,
        isFeatured,
        questionCount,
        estimatedMinutes,
        theme.name AS theme_name,
        theme.slug AS theme_slug,
        created_at
      FROM quiz 
      WHERE subject.code = $code
      ORDER BY created_at DESC
    `, { code });
    
    const quizzes = (quizResult[0] as any[])?.map((q: any) => ({
      id: q.id?.toString(),
      title: q.title,
      slug: q.slug,
      description: q.description,
      difficulty: q.difficulty,
      isActive: q.isActive,
      isFeatured: q.isFeatured,
      questionCount: q.questionCount,
      estimatedMinutes: q.estimatedMinutes,
      theme_name: q.theme_name,
      theme_slug: q.theme_slug,
      created_at: q.created_at
    })) || [];
    
    return {
      quizzes
    };
  } catch (err) {
    console.error('Error loading quizzes:', err);
    return {
      quizzes: []
    };
  }
};
