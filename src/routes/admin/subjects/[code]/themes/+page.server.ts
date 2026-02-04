import type { PageServerLoad } from './$types';
import { connectDB } from '$lib/db';

export const load: PageServerLoad = async ({ params }) => {
  const { code } = params;
  
  try {
    const db = await connectDB();
    
    // Récupérer les thèmes avec leurs stats
    const themesResult = await db.query<any[]>(`
      SELECT 
        id,
        name,
        slug,
        description,
        is_active,
        created_at,
        (SELECT count() FROM question WHERE theme = $parent.id GROUP ALL)[0].count AS question_count,
        (SELECT count() FROM quiz WHERE theme = $parent.id GROUP ALL)[0].count AS quiz_count
      FROM theme 
      WHERE subject.code = $code
      ORDER BY name ASC
    `, { code });
    
    const themes = (themesResult[0] as any[])?.map((t: any) => ({
      id: t.id?.toString(),
      name: t.name,
      slug: t.slug,
      description: t.description,
      is_active: t.is_active,
      question_count: t.question_count || 0,
      quiz_count: t.quiz_count || 0,
      created_at: t.created_at
    })) || [];
    
    return {
      themes
    };
  } catch (err) {
    console.error('Error loading themes:', err);
    return {
      themes: []
    };
  }
};
