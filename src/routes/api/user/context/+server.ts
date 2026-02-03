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
    
    // Récupérer l'utilisateur avec son contexte éducatif
    const [user] = await db.query<[any[]]>(`
      SELECT 
        id,
        name,
        current_cycle,
        current_grade,
        preferred_language,
        education_system
      FROM type::thing("user", $userId)
    `, { userId });

    if (!user || user.length === 0) {
      return json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const userData = user[0];
    
    // Construire la réponse avec les noms lisibles
    const context: {
      country?: string;
      cycle?: string;
      cycleName?: string;
      grade?: string;
      gradeName?: string;
    } = {};

    // Récupérer le nom du cycle
    if (userData.current_cycle) {
      const cycleId = typeof userData.current_cycle === 'string' 
        ? userData.current_cycle.replace('cycle:', '')
        : userData.current_cycle.id || userData.current_cycle;
        
      const [cycleResult] = await db.query<[any[]]>(`
        SELECT name, slug FROM type::thing("cycle", $cycleId)
      `, { cycleId });
      
      if (cycleResult && cycleResult.length > 0) {
        context.cycle = cycleResult[0].slug;
        context.cycleName = cycleResult[0].name;
      }
    }

    // Récupérer le nom de la classe
    if (userData.current_grade) {
      const gradeId = typeof userData.current_grade === 'string'
        ? userData.current_grade.replace('grade:', '')
        : userData.current_grade.id || userData.current_grade;
        
      const [gradeResult] = await db.query<[any[]]>(`
        SELECT name, slug FROM type::thing("grade", $gradeId)
      `, { gradeId });
      
      if (gradeResult && gradeResult.length > 0) {
        context.grade = gradeResult[0].slug;
        context.gradeName = gradeResult[0].name;
      }
    }

    // Déterminer le pays (pour l'instant France par défaut)
    context.country = 'France';

    return json(context);
    
  } catch (error) {
    console.error('Erreur récupération contexte:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
