import type { PageServerLoad, Actions } from './$types';
import { connectDB } from '$lib/db';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const { code, slug } = params;
  
  try {
    const db = await connectDB();
    
    // Récupérer le thème
    const themeResult = await db.query<any[]>(`
      SELECT 
        id,
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at
      FROM theme 
      WHERE slug = $slug AND subject.code = $code
      LIMIT 1
    `, { slug, code });
    
    const themeData = (themeResult[0] as any[])?.[0];
    
    if (!themeData) {
      return redirect(302, `/admin/subjects/${code}/themes`);
    }
    
    const theme = {
      id: themeData.id?.toString(),
      name: themeData.name,
      slug: themeData.slug,
      description: themeData.description,
      is_active: themeData.is_active,
      created_at: themeData.created_at instanceof Date ? themeData.created_at.toISOString() : themeData.created_at,
      updated_at: themeData.updated_at instanceof Date ? themeData.updated_at.toISOString() : themeData.updated_at
    };
    
    // Récupérer les questions de ce thème
    const questionsResult = await db.query<any[]>(`
      SELECT 
        id,
        question,
        type,
        difficulty,
        is_active,
        created_at
      FROM question 
      WHERE theme.slug = $slug
      ORDER BY created_at DESC
      LIMIT 50
    `, { slug });
    
    const questions = (questionsResult[0] as any[])?.map((q: any) => ({
      id: q.id?.toString(),
      question: q.question,
      type: q.type,
      difficulty: q.difficulty,
      is_active: q.is_active,
      created_at: q.created_at instanceof Date ? q.created_at.toISOString() : q.created_at
    })) || [];
    
    // Récupérer les quiz de ce thème
    const quizResult = await db.query<any[]>(`
      SELECT 
        id,
        title,
        slug,
        is_active,
        is_public,
        created_at
      FROM quiz 
      WHERE theme.slug = $slug
      ORDER BY created_at DESC
    `, { slug });
    
    const quizzes = (quizResult[0] as any[])?.map((q: any) => ({
      id: q.id?.toString(),
      title: q.title,
      slug: q.slug,
      is_active: q.is_active,
      is_public: q.is_public,
      created_at: q.created_at instanceof Date ? q.created_at.toISOString() : q.created_at
    })) || [];
    
    return {
      theme,
      questions,
      quizzes
    };
  } catch (err) {
    console.error('Error loading theme:', err);
    return redirect(302, `/admin/subjects/${code}/themes`);
  }
};

export const actions: Actions = {
  update: async ({ request, params }) => {
    const { code, slug } = params;
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const is_active = formData.get('is_active') === 'on';
    
    if (!name?.trim()) {
      return fail(400, { error: 'Le nom est requis' });
    }
    
    try {
      const db = await connectDB();
      
      await db.query(`
        UPDATE theme SET
          name = $name,
          description = $description,
          is_active = $is_active,
          updated_at = time::now()
        WHERE slug = $slug AND subject.code = $code
      `, { slug, code, name: name.trim(), description: description?.trim() || null, is_active });
      
      return { success: true };
    } catch (err) {
      console.error('Error updating theme:', err);
      return fail(500, { error: 'Erreur lors de la mise à jour' });
    }
  },
  
  delete: async ({ params }) => {
    const { code, slug } = params;
    
    try {
      const db = await connectDB();
      
      // Vérifier s'il y a des questions liées
      const countResult = await db.query<any[]>(`
        SELECT count() FROM question WHERE theme.slug = $slug GROUP ALL
      `, { slug });
      
      const count = (countResult[0] as any[])?.[0]?.count || 0;
      
      if (count > 0) {
        return fail(400, { error: `Impossible de supprimer: ${count} question(s) liée(s)` });
      }
      
      await db.query(`
        DELETE FROM theme WHERE slug = $slug AND subject.code = $code
      `, { slug, code });
      
      return redirect(302, `/admin/subjects/${code}/themes`);
    } catch (err) {
      console.error('Error deleting theme:', err);
      return fail(500, { error: 'Erreur lors de la suppression' });
    }
  }
};
