/**
 * API: Gestion individuelle d'une classe
 * DELETE /api/establishment/classes/[id] - Supprimer une classe
 */
import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// DELETE: Supprimer une classe
export const DELETE: RequestHandler = async ({ params, cookies }) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    const classId = params.id;
    if (!classId) {
      return json({ success: false, message: 'ID de classe requis' }, { status: 400 });
    }

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

    const cleanClassId = classId.includes(':') ? classId.split(':')[1] : classId;

    // Vérifier que la classe appartient à cet établissement
    const classCheck = await db.query<any[]>(`
      SELECT * FROM establishment_class 
      WHERE id = type::thing("establishment_class", $classId)
      AND establishment = $establishmentId
    `, { classId: cleanClassId, establishmentId: establishment.id });

    if (!(classCheck[0] as any[])?.length) {
      return json({ success: false, message: 'Classe non trouvée' }, { status: 404 });
    }

    // Supprimer d'abord les membres de la classe
    await db.query(`
      DELETE class_member WHERE class = type::thing("establishment_class", $classId)
    `, { classId: cleanClassId });

    // Supprimer la classe
    await db.query(`
      DELETE establishment_class WHERE id = type::thing("establishment_class", $classId)
    `, { classId: cleanClassId });

    return json({ success: true, message: 'Classe supprimée' });

  } catch (error) {
    console.error('Delete class error:', error);
    return json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
};
