import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET: Récupérer les favoris d'un utilisateur
export const GET: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    const userId = params.userId;
    const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;

    const result = await db.query<any[]>(`
      SELECT 
        id, quiz_id, created_at, notes,
        quiz_id.title as quiz_title,
        quiz_id.slug as quiz_slug,
        quiz_id.description as quiz_description,
        quiz_id.coverImage as quiz_cover,
        quiz_id.difficulty_level as quiz_difficulty,
        quiz_id.subject.name as subject_name,
        quiz_id.subject.color as subject_color
      FROM user_favorite 
      WHERE user_id = type::thing("user", $userId)
      ORDER BY created_at DESC
    `, { userId: cleanUserId });

    const favorites = (result[0] || []).map((f: any) => ({
      id: f.id?.toString(),
      quizId: f.quiz_id?.toString(),
      quizTitle: f.quiz_title,
      quizSlug: f.quiz_slug,
      quizDescription: f.quiz_description,
      quizCover: f.quiz_cover,
      quizDifficulty: f.quiz_difficulty || 1,
      subjectName: f.subject_name,
      subjectColor: f.subject_color,
      createdAt: f.created_at,
      notes: f.notes
    }));

    return json({ favorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    return json({ favorites: [], error: 'Erreur lors du chargement des favoris' }, { status: 500 });
  }
};

// POST: Ajouter un quiz aux favoris
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const db = await connectDB();
    const userId = params.userId;
    const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;
    
    const body = await request.json();
    const { quizId, notes } = body;
    
    if (!quizId) {
      return json({ error: 'quizId requis' }, { status: 400 });
    }

    const cleanQuizId = quizId.includes(':') ? quizId.split(':')[1] : quizId;

    // Vérifier si déjà en favori
    const existing = await db.query<any[]>(`
      SELECT id FROM user_favorite 
      WHERE user_id = type::thing("user", $userId) 
        AND quiz_id = type::thing("quiz", $quizId)
    `, { userId: cleanUserId, quizId: cleanQuizId });

    if ((existing[0] as any[])?.length > 0) {
      return json({ error: 'Déjà dans les favoris', alreadyExists: true }, { status: 400 });
    }

    // Créer le favori
    const createResult = await db.query<any[]>(`
      CREATE user_favorite SET
        user_id = type::thing("user", $userId),
        quiz_id = type::thing("quiz", $quizId),
        notes = $notes,
        created_at = time::now()
    `, { userId: cleanUserId, quizId: cleanQuizId, notes: notes || null });

    // Incrémenter le compteur sur le quiz
    await db.query(`
      UPDATE type::thing("quiz", $quizId) SET favorite_count += 1
    `, { quizId: cleanQuizId });

    const favorite = (createResult[0] as any[])?.[0];

    return json({ 
      success: true, 
      favorite: {
        id: favorite?.id?.toString(),
        quizId: `quiz:${cleanQuizId}`,
        createdAt: favorite?.created_at
      }
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    return json({ error: 'Erreur lors de l\'ajout aux favoris' }, { status: 500 });
  }
};

// DELETE: Supprimer un favori
export const DELETE: RequestHandler = async ({ params, request }) => {
  try {
    const db = await connectDB();
    const userId = params.userId;
    const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;
    
    const body = await request.json();
    const { quizId } = body;
    
    if (!quizId) {
      return json({ error: 'quizId requis' }, { status: 400 });
    }

    const cleanQuizId = quizId.includes(':') ? quizId.split(':')[1] : quizId;

    // Supprimer le favori
    await db.query(`
      DELETE user_favorite 
      WHERE user_id = type::thing("user", $userId) 
        AND quiz_id = type::thing("quiz", $quizId)
    `, { userId: cleanUserId, quizId: cleanQuizId });

    // Décrémenter le compteur sur le quiz
    await db.query(`
      UPDATE type::thing("quiz", $quizId) SET favorite_count -= 1 WHERE favorite_count > 0
    `, { quizId: cleanQuizId });

    return json({ success: true });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return json({ error: 'Erreur lors de la suppression du favori' }, { status: 500 });
  }
};
