import type { PageServerLoad, Actions } from './$types';
import { connectDB } from '$lib/db';
import { error, fail } from '@sveltejs/kit';
import { RecordId } from 'surrealdb';

// Helper to serialize RecordId
function serialize<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (data instanceof RecordId) return data.toString() as T;
  if (data instanceof Date) return data.toISOString() as T;
  if (Array.isArray(data)) return data.map(serialize) as T;
  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = serialize(value);
    }
    return result as T;
  }
  return data;
}

export const load: PageServerLoad = async ({ params }) => {
  const { code, slug } = params;
  
  try {
    const db = await connectDB();
    
    // Récupérer le quiz
    const quizResult = await db.query<any[]>(`
      SELECT * FROM quiz WHERE slug = $slug
    `, { slug });
    
    const quiz = (quizResult[0] as any[])?.[0];
    
    if (!quiz) {
      throw error(404, `Quiz "${slug}" non trouvé`);
    }
    
    // Récupérer les thèmes associés au quiz
    const themeIds = quiz.theme_ids || [];
    let quizThemes: any[] = [];
    if (themeIds.length > 0) {
      const themesResult = await db.query<any[]>(`
        SELECT id, name, slug, description FROM theme WHERE id INSIDE $ids
      `, { ids: themeIds });
      quizThemes = serialize((themesResult[0] as any[]) || []);
    }
    
    // Récupérer tous les thèmes disponibles pour ce subject
    const allThemesResult = await db.query<any[]>(`
      SELECT id, name, slug, description FROM theme 
      WHERE subject.code = $code AND is_active = true
      ORDER BY name ASC
    `, { code });
    const allThemes = serialize((allThemesResult[0] as any[]) || []);
    
    // Récupérer les questions du quiz (si définies)
    let quizQuestions: any[] = [];
    const questionIds = quiz.question_ids || [];
    if (questionIds.length > 0) {
      const questionsResult = await db.query<any[]>(`
        SELECT id, question, questionType, difficulty, isActive FROM question WHERE id INSIDE $ids
      `, { ids: questionIds });
      quizQuestions = serialize((questionsResult[0] as any[]) || []);
    }
    
    // Récupérer toutes les questions disponibles pour les thèmes du quiz
    let availableQuestions: any[] = [];
    if (themeIds.length > 0) {
      const availableResult = await db.query<any[]>(`
        SELECT id, question, questionType, difficulty, isActive, theme_ids 
        FROM question 
        WHERE isActive = true AND theme_ids ANYINSIDE $themeIds
        ORDER BY question ASC
      `, { themeIds });
      availableQuestions = serialize((availableResult[0] as any[]) || []);
    }
    
    // Récupérer les slides du quiz
    const slidesResult = await db.query<any[]>(`
      SELECT * FROM quiz_slide WHERE quiz_id = $quizId ORDER BY pos ASC
    `, { quizId: quiz.id });
    const quizSlides = serialize((slidesResult[0] as any[]) || []);
    
    return {
      quiz: serialize(quiz),
      quizThemes,
      allThemes,
      quizQuestions,
      availableQuestions,
      quizSlides
    };
  } catch (err: any) {
    if (err.status === 404) throw err;
    console.error('Error loading quiz:', err);
    throw error(500, 'Erreur lors du chargement du quiz');
  }
};

export const actions: Actions = {
  // Mettre à jour les infos générales du quiz
  updateInfo: async ({ params, request }) => {
    const { slug } = params;
    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const difficulty = formData.get('difficulty') as string;
    const isActive = formData.get('isActive') === 'true';
    const isPublic = formData.get('isPublic') === 'true';
    const maxQuestions = parseInt(formData.get('maxQuestions') as string) || null;
    const timeLimit = parseInt(formData.get('timeLimit') as string) || null;
    
    if (!title?.trim()) {
      return fail(400, { error: 'Le titre est requis' });
    }
    
    try {
      const db = await connectDB();
      
      await db.query(`
        UPDATE quiz SET
          title = $title,
          description = $description,
          difficulty = $difficulty,
          isActive = $isActive,
          isPublic = $isPublic,
          maxQuestions = $maxQuestions,
          timeLimit = $timeLimit,
          updated_at = time::now()
        WHERE slug = $slug
      `, {
        slug,
        title: title.trim(),
        description: description?.trim() || null,
        difficulty: difficulty || 'medium',
        isActive,
        isPublic,
        maxQuestions,
        timeLimit
      });
      
      return { success: true, message: 'Quiz mis à jour' };
    } catch (err) {
      console.error('Error updating quiz:', err);
      return fail(500, { error: 'Erreur lors de la mise à jour' });
    }
  },
  
  // Mettre à jour les thèmes du quiz
  updateThemes: async ({ params, request }) => {
    const { slug } = params;
    const formData = await request.formData();
    const themeIds = formData.getAll('theme_ids') as string[];
    
    try {
      const db = await connectDB();
      
      // Construire les RecordIds des thèmes
      const themeRecords = themeIds.map(id => {
        const cleanId = id.includes(':') ? id.split(':')[1] : id;
        return `type::thing("theme", "${cleanId}")`;
      });
      
      await db.query(`
        UPDATE quiz SET
          theme_ids = [${themeRecords.join(', ')}],
          updated_at = time::now()
        WHERE slug = $slug
      `, { slug });
      
      return { success: true, message: 'Thèmes mis à jour' };
    } catch (err) {
      console.error('Error updating themes:', err);
      return fail(500, { error: 'Erreur lors de la mise à jour des thèmes' });
    }
  },
  
  // Mettre à jour les questions sélectionnées
  updateQuestions: async ({ params, request }) => {
    const { slug } = params;
    const formData = await request.formData();
    const questionIds = formData.getAll('question_ids') as string[];
    
    try {
      const db = await connectDB();
      
      // Construire les RecordIds des questions
      const questionRecords = questionIds.map(id => {
        const cleanId = id.includes(':') ? id.split(':')[1] : id;
        return `type::thing("question", "${cleanId}")`;
      });
      
      await db.query(`
        UPDATE quiz SET
          question_ids = [${questionRecords.join(', ')}],
          questionCount = ${questionIds.length},
          updated_at = time::now()
        WHERE slug = $slug
      `, { slug });
      
      return { success: true, message: 'Questions mises à jour' };
    } catch (err) {
      console.error('Error updating questions:', err);
      return fail(500, { error: 'Erreur lors de la mise à jour des questions' });
    }
  }
};
