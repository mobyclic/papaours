import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
  const db = await getSurrealDB();
  
  try {
    const userId = `user:${params.userId}`;
    
    // Get user data
    const [userData] = await db.query<[any[]]>(`SELECT * FROM $userId`, { userId });
    const user = userData?.[0];
    
    if (!user) {
      return json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    
    // Get quiz results
    const [results] = await db.query<[any[]]>(`
      SELECT 
        quiz.title as quiz_title,
        quiz.slug as quiz_slug,
        score,
        total_questions,
        completed_at,
        time_spent
      FROM user_result 
      WHERE user = $userId
      ORDER BY completed_at DESC
    `, { userId });
    
    // Get badges
    const [badges] = await db.query<[any[]]>(`
      SELECT 
        badge.name as name,
        badge.description as description,
        badge.icon as icon,
        badge.category as category,
        badge.points as points,
        earned_at
      FROM user_badge 
      WHERE user = $userId
    `, { userId });
    
    // Get favorites
    const [favorites] = await db.query<[any[]]>(`
      SELECT 
        quiz.title as title,
        quiz.slug as slug,
        added_at
      FROM user_favorite 
      WHERE user = $userId
    `, { userId });
    
    // Get competences
    const [competences] = await db.query<[any[]]>(`
      SELECT 
        competence.code as code,
        competence.name as name,
        mastery_level,
        correct_answers,
        total_answers,
        last_practiced
      FROM user_competence 
      WHERE user = $userId
    `, { userId });
    
    // Clean sensitive data
    const exportData = {
      exportDate: new Date().toISOString(),
      profile: {
        email: user.email,
        name: user.name,
        prenom: user.prenom,
        nom: user.nom,
        level: user.level,
        total_xp: user.total_xp,
        current_streak: user.current_streak,
        best_streak: user.best_streak,
        profile_type: user.profile_type,
        created_at: user.created_at
      },
      statistics: {
        totalQuizzes: results?.length || 0,
        totalBadges: badges?.length || 0,
        totalFavorites: favorites?.length || 0
      },
      quizHistory: results || [],
      badges: badges || [],
      favorites: favorites || [],
      competences: competences || []
    };
    
    return json(exportData);
    
  } catch (error) {
    console.error('Erreur export données:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
