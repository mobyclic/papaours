/**
 * API: Supprimer un tuteur de l'établissement
 * DELETE /api/establishment/tutors/[id]
 */
import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, cookies }) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    const { id: tutorId } = params;

    const db = await connectDB();

    // Vérifier la session
    const sessionResult = await db.query<any[]>(`
      SELECT user.* FROM session 
      WHERE session_token = $sessionToken 
      AND expires_at > time::now()
      FETCH user
    `, { sessionToken: sessionToken });

    const sessions = sessionResult[0] as any[];
    if (!sessions || sessions.length === 0) {
      return json({ success: false, message: 'Session invalide' }, { status: 401 });
    }

    const establishment = sessions[0].user;
    if (establishment.profile_type !== 'etablissement') {
      return json({ success: false, message: 'Accès réservé aux établissements' }, { status: 403 });
    }

    // Vérifier que le tuteur appartient à cet établissement
    const cleanId = tutorId.includes(':') ? tutorId.split(':')[1] : tutorId;
    const tutorResult = await db.query<any[]>(`
      SELECT * FROM user 
      WHERE id = type::thing("user", $tutorId)
      AND created_by_establishment = $establishmentId
    `, { tutorId: cleanId, establishmentId: establishment.id });

    if (!(tutorResult[0] as any[])?.length) {
      return json({ success: false, message: 'Tuteur non trouvé' }, { status: 404 });
    }

    // Supprimer le lien avec l'établissement (ne pas supprimer le compte)
    await db.query(`
      UPDATE type::thing("user", $tutorId) SET 
        created_by_establishment = NONE
    `, { tutorId: cleanId });

    return json({ success: true, message: 'Tuteur retiré de l\'établissement' });

  } catch (error) {
    console.error('Remove tutor error:', error);
    return json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
};
