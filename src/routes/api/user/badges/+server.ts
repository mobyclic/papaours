import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ cookies }) => {
  const sessionToken = cookies.get('session');
  
  if (!sessionToken) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    const db = await getSurrealDB();
    
    // Valider la session et récupérer l'utilisateur
    const [sessions] = await db.query<any[]>(`
      SELECT user FROM session 
      WHERE session_token = $sessionToken 
        AND expires_at > time::now()
    `, { sessionToken });
    
    if (!sessions || sessions.length === 0) {
      return json({ error: 'Session expirée' }, { status: 401 });
    }
    
    const userIdFromSession = sessions[0].user?.toString();
    if (!userIdFromSession) {
      return json({ error: 'Session invalide' }, { status: 401 });
    }
    
    const userId = userIdFromSession.includes(':') ? userIdFromSession.split(':')[1] : userIdFromSession;
    
    // Récupérer les badges débloqués par l'utilisateur
    const [userBadges] = await db.query<[any[]]>(`
      SELECT 
        badge.name AS name,
        badge.icon AS icon,
        badge.description AS description,
        badge.category AS category,
        unlocked_at
      FROM user_badge
      WHERE user = type::thing("user", $userId)
      ORDER BY unlocked_at DESC
    `, { userId });

    if (!userBadges || userBadges.length === 0) {
      return json({ badges: [] });
    }

    // Mapper les résultats
    const badges = userBadges.map(b => ({
      name: b.name,
      icon: b.icon || '🎖️',
      description: b.description,
      category: b.category,
      unlockedAt: b.unlocked_at
    }));

    return json({ badges });
    
  } catch (error) {
    console.error('Erreur récupération badges:', error);
    return json({ badges: [] });
  }
};
