import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const POST: RequestHandler = async ({ cookies }) => {
  const sessionId = cookies.get('session_id');
  
  if (!sessionId) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  const db = await getSurrealDB();
  
  try {
    // Récupérer l'utilisateur via la session
    const sessionResult = await db.query<[{ user: string }[]]>(
      `SELECT user FROM session WHERE id = $sessionId AND expires_at > time::now()`,
      { sessionId }
    );
    
    if (!sessionResult[0]?.[0]?.user) {
      return json({ error: 'Session invalide' }, { status: 401 });
    }
    
    const userId = sessionResult[0][0].user;
    
    // Mettre à jour le profile_type en tuteur
    await db.query(
      `UPDATE $userId SET profile_type = 'tuteur', updated_at = time::now()`,
      { userId }
    );
    
    return json({ success: true, message: 'Vous êtes maintenant tuteur' });
    
  } catch (error) {
    console.error('Erreur upgrade tuteur:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
