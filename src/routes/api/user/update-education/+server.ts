import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, cookies }) => {
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
    
    // Get request data
    const body = await request.json();
    const { educationSystem, cycle, grade, language } = body;
    
    // Build update query dynamically
    const updates: string[] = ['updated_at = time::now()'];
    const params: Record<string, any> = { userId };
    
    if (educationSystem) {
      updates.push('education_system = type::thing("education_system", $educationSystem)');
      params.educationSystem = educationSystem;
    }
    
    if (cycle) {
      updates.push('current_cycle = type::thing("cycle", $cycle)');
      params.cycle = cycle;
    }
    
    if (grade) {
      updates.push('current_grade = type::thing("grade", $grade)');
      params.grade = grade;
    }
    
    if (language) {
      updates.push('preferred_language = type::thing("language", $language)');
      params.language = language;
    }
    
    // Execute update
    await db.query(`UPDATE $userId SET ${updates.join(', ')}`, params);
    
    return json({ success: true });
    
  } catch (error) {
    console.error('Erreur mise à jour éducation:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
