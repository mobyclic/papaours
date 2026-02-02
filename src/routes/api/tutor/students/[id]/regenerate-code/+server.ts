import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// Générer un code à 4 chiffres
function generateLoginCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// POST: Régénérer le code d'un élève
export const POST: RequestHandler = async ({ params, cookies }) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    const { id: studentId } = params;

    const db = await connectDB();

    // Vérifier la session et récupérer l'utilisateur
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

    const tutor = sessions[0].user;
    if (tutor.profile_type !== 'tuteur') {
      return json({ success: false, message: 'Accès réservé aux tuteurs' }, { status: 403 });
    }

    // Vérifier que l'élève appartient bien à ce tuteur
    const studentResult = await db.query<any[]>(`
      SELECT * FROM user 
      WHERE id = type::thing("user", $studentId)
      AND created_by_tutor = $tutorId
    `, { 
      studentId: studentId.includes(':') ? studentId.split(':')[1] : studentId,
      tutorId: tutor.id 
    });

    const students = studentResult[0] as any[];
    if (!students || students.length === 0) {
      return json({ success: false, message: 'Élève non trouvé' }, { status: 404 });
    }

    // Générer un nouveau code
    const newCode = generateLoginCode();

    // Mettre à jour
    await db.query(`
      UPDATE type::thing("user", $studentId) SET login_code = $newCode
    `, { 
      studentId: studentId.includes(':') ? studentId.split(':')[1] : studentId,
      newCode 
    });

    return json({ 
      success: true, 
      message: 'Code régénéré',
      login_code: newCode
    });

  } catch (error) {
    console.error('Regenerate code error:', error);
    return json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
};
