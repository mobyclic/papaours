import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, cookies }) => {
  // Récupérer l'utilisateur depuis la session
  const sessionToken = cookies.get('session');
  if (!sessionToken) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }
  
  const db = await getSurrealDB();
  
  // Valider la session et récupérer l'utilisateur
  let userId: string;
  try {
    const [sessions] = await db.query<any[]>(`
      SELECT user FROM session 
      WHERE session_token = $sessionToken 
        AND expires_at > time::now()
    `, { sessionToken });
    
    if (!sessions || sessions.length === 0) {
      return json({ error: 'Session expirée' }, { status: 401 });
    }
    
    userId = sessions[0].user?.toString();
    if (!userId) throw new Error('No user ID in session');
  } catch (e) {
    console.error('Session validation error:', e);
    return json({ error: 'Session invalide' }, { status: 401 });
  }
  
  const data = await request.json();
  const { education_system, current_cycle, current_track, current_grade, specialties, preferred_language } = data;
  
  if (!education_system || !current_cycle || !current_grade) {
    return json({ error: 'Données incomplètes' }, { status: 400 });
  }
  
  try {
    // Extraire les IDs clean
    const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;
    const cleanSystemId = education_system.includes(':') ? education_system.split(':')[1] : education_system;
    const cleanCycleId = current_cycle.includes(':') ? current_cycle.split(':')[1] : current_cycle;
    const cleanGradeId = current_grade.includes(':') ? current_grade.split(':')[1] : current_grade;
    const cleanTrackId = current_track 
      ? (current_track.includes(':') ? current_track.split(':')[1] : current_track)
      : null;
    
    // Construire les références aux spécialités
    const specialtyRefs = (specialties || []).map((s: string) => {
      const cleanId = s.includes(':') ? s.split(':')[1] : s;
      return `specialty:${cleanId}`;
    });
    
    // Construire la requête UPDATE dynamiquement
    let updateQuery = `
      UPDATE user:${cleanUserId} SET
        education_system = type::thing("education_system", $systemId),
        current_cycle = type::thing("cycle", $cycleId),
        current_grade = type::thing("grade", $gradeId),
        preferred_language = type::thing("language", $langCode),
        onboarding_completed = true,
        updated_at = time::now()
    `;
    
    const params: Record<string, any> = {
      systemId: cleanSystemId,
      cycleId: cleanCycleId,
      gradeId: cleanGradeId,
      langCode: preferred_language || 'fr',
    };
    
    // Ajouter la track si présente
    if (cleanTrackId) {
      updateQuery = updateQuery.replace(
        'onboarding_completed = true',
        'current_track = type::thing("track", $trackId), onboarding_completed = true'
      );
      params.trackId = cleanTrackId;
    }
    
    // Ajouter les spécialités si présentes
    if (specialtyRefs.length > 0) {
      updateQuery = updateQuery.replace(
        'onboarding_completed = true',
        `specialties = [${specialtyRefs.join(', ')}], onboarding_completed = true`
      );
    }
    
    await db.query(updateQuery, params);
    
    return json({ success: true });
  } catch (error) {
    console.error('Failed to save onboarding:', error);
    return json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
  }
};
