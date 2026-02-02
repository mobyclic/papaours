import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const DELETE: RequestHandler = async ({ cookies }) => {
  const sessionId = cookies.get('session_id');
  
  if (!sessionId) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  const db = await getSurrealDB();
  
  try {
    // Get user from session
    const [session] = await db.query<[{ user: string }[]]>(
      `SELECT user FROM session WHERE id = $sessionId AND expires_at > time::now()`,
      { sessionId }
    );
    
    if (!session?.[0]?.user) {
      return json({ error: 'Session invalide' }, { status: 401 });
    }
    
    const userId = session[0].user;
    
    // Delete all user-related data
    await db.query(`
      -- Delete quiz results
      DELETE user_result WHERE user = $userId;
      
      -- Delete badges
      DELETE user_badge WHERE user = $userId;
      
      -- Delete favorites
      DELETE user_favorite WHERE user = $userId;
      
      -- Delete competences
      DELETE user_competence WHERE user = $userId;
      
      -- Delete progress
      DELETE user_progress WHERE user = $userId;
      
      -- Delete quiz library
      DELETE user_quiz_library WHERE user = $userId;
      
      -- Delete sessions
      DELETE session WHERE user = $userId;
      
      -- Delete email verifications
      DELETE email_verification WHERE user = $userId;
      
      -- Delete password reset tokens
      DELETE password_reset_token WHERE user = $userId;
      
      -- Delete tutor relationships
      DELETE tutor_student WHERE tutor = $userId OR student = $userId;
      
      -- Delete child profiles if user is tutor
      DELETE child_profile WHERE tutor = $userId;
      
      -- Finally delete the user
      DELETE $userId;
    `, { userId });
    
    // Clear session cookie
    cookies.delete('session_id', { path: '/' });
    
    return json({ success: true, message: 'Compte supprimé avec succès' });
    
  } catch (error) {
    console.error('Erreur suppression compte:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
