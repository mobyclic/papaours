/**
 * API: Envoyer une invitation à un apprenant (tuteur uniquement)
 * POST /api/tutor/invite
 */
import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import { sendStudentInviteEmail } from '$lib/server/email';
import type { RequestHandler } from './$types';

// Génère un code d'invitation court (6 caractères alphanumériques)
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans I, O, 0, 1 pour éviter confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { tutor_id, student_email, student_name } = await request.json();

    if (!tutor_id) {
      return json({ message: 'ID tuteur requis' }, { status: 400 });
    }

    const db = await connectDB();

    // Vérifier que le tuteur existe et est bien un tuteur
    const tutorResult = await db.query<any[]>(
      `SELECT * FROM user WHERE id = type::thing('user', $tutorId) AND user_type = 'tuteur'`,
      { tutorId: tutor_id.split(':')[1] || tutor_id }
    );

    const tutors = tutorResult[0] as any[];
    if (!tutors || tutors.length === 0) {
      return json({ message: 'Tuteur non trouvé' }, { status: 404 });
    }

    const tutor = tutors[0];

    // Générer un code unique
    let code: string;
    let attempts = 0;
    do {
      code = generateInviteCode();
      const existing = await db.query<any[]>(
        `SELECT * FROM invite_code WHERE code = $code AND used = false`,
        { code }
      );
      if (!(existing[0] as any[])?.length) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return json({ message: 'Erreur génération code' }, { status: 500 });
    }

    // Créer le code d'invitation (expire dans 7 jours)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.query(
      `CREATE invite_code SET 
        tutor_id = type::thing('user', $tutorId),
        code = $code,
        student_email = $studentEmail,
        student_name = $studentName,
        expires_at = $expiresAt,
        used = false`,
      { 
        tutorId: tutor_id.split(':')[1] || tutor_id,
        code,
        studentEmail: student_email || null,
        studentName: student_name || null,
        expiresAt
      }
    );

    // Envoyer l'email si fourni
    let emailSent = false;
    if (student_email) {
      const emailResult = await sendStudentInviteEmail(
        student_email,
        student_name || 'Cher apprenant',
        tutor.name || `${tutor.prenom} ${tutor.nom}`,
        code
      );
      emailSent = emailResult.success;
    }

    return json({ 
      success: true,
      code,
      email_sent: emailSent,
      expires_at: expiresAt.toISOString(),
      message: student_email 
        ? `Invitation envoyée à ${student_email}` 
        : `Code d'invitation créé: ${code}`
    });

  } catch (error) {
    console.error('Invite error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};

/**
 * GET: Liste des invitations d'un tuteur
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    const tutorId = url.searchParams.get('tutor_id');
    
    if (!tutorId) {
      return json({ message: 'ID tuteur requis' }, { status: 400 });
    }

    const db = await connectDB();

    const result = await db.query<any[]>(
      `SELECT *, used_by.pseudo as used_by_pseudo, used_by.name as used_by_name 
       FROM invite_code 
       WHERE tutor_id = type::thing('user', $tutorId)
       ORDER BY created_at DESC`,
      { tutorId: tutorId.split(':')[1] || tutorId }
    );

    const invites = (result[0] as any[]) || [];

    return json({ 
      success: true,
      invites: invites.map(inv => ({
        ...inv,
        id: inv.id?.toString(),
        tutor_id: inv.tutor_id?.toString(),
        used_by: inv.used_by?.toString()
      }))
    });

  } catch (error) {
    console.error('Get invites error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
