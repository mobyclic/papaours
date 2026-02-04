import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const sessionToken = cookies.get('session');
  
  if (!sessionToken) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  const db = await getSurrealDB();
  
  try {
    // Get user from session
    const [session] = await db.query(
      `SELECT user FROM session WHERE session_token = $sessionToken AND expires_at > time::now()`,
      { sessionToken }
    ) as [{ user: string }[]];
    
    if (!session?.[0]?.user) {
      return json({ error: 'Session invalide' }, { status: 401 });
    }
    
    const userId = session[0].user;
    
    // Get request data
    const body = await request.json();
    const { educationSystem, cycle, track, grade, specialties, language } = body;
    
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
    
    if (track) {
      updates.push('current_track = type::thing("track", $track)');
      params.track = track;
    } else if (track === null) {
      // Explicitly remove track if null is passed
      updates.push('current_track = NONE');
    }
    
    if (grade) {
      updates.push('current_grade = type::thing("grade", $grade)');
      params.grade = grade;
    }
    
    // Handle specialties array
    if (specialties !== undefined) {
      if (Array.isArray(specialties) && specialties.length > 0) {
        // Build specialty references
        const specialtyRefs = specialties.map((s: string) => {
          const cleanId = s.includes(':') ? s.split(':')[1] : s;
          return `type::thing("specialty", "${cleanId}")`;
        });
        updates.push(`specialties = [${specialtyRefs.join(', ')}]`);
      } else {
        // Empty array or null - clear specialties
        updates.push('specialties = []');
      }
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
