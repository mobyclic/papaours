/**
 * API: Gestion des tuteurs d'un établissement
 * GET /api/establishment/tutors - Liste des tuteurs
 * POST /api/establishment/tutors - Inviter un tuteur
 */
import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import { sendTutorInviteEmail } from '$lib/server/email';
import type { RequestHandler } from './$types';

// Hash simple pour le mot de passe
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'kweez_salt_2024');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Générer un mot de passe temporaire
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Générer un slug tuteur
function generateTutorSlug(prenom: string, nom: string): string {
  const base = `${prenom}-${nom}`.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const random = Math.random().toString(36).substring(2, 6);
  return `${base}-${random}`;
}

// GET: Liste des tuteurs de l'établissement
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ success: false, message: 'Non authentifié' }, { status: 401 });
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

    // Récupérer les tuteurs avec le nombre d'étudiants
    const tutorsResult = await db.query<any[]>(`
      SELECT 
        id, prenom, nom, email, created_at,
        (SELECT count() FROM user WHERE created_by_tutor = $parent.id GROUP ALL)[0].count as students_count
      FROM user 
      WHERE created_by_establishment = $establishmentId
      ORDER BY created_at DESC
    `, { establishmentId: establishment.id });

    const tutors = (tutorsResult[0] as any[]) || [];

    return json({
      success: true,
      tutors: tutors.map(t => ({
        id: t.id?.toString() || t.id,
        prenom: t.prenom,
        nom: t.nom,
        email: t.email,
        created_at: t.created_at,
        students_count: t.students_count || 0
      }))
    });

  } catch (error) {
    console.error('Get establishment tutors error:', error);
    return json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
};

// POST: Inviter un nouveau tuteur
export const POST: RequestHandler = async ({ request, cookies, url }) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    const { email, prenom, nom } = await request.json();

    if (!email || !prenom || !nom) {
      return json({ success: false, message: 'Email, prénom et nom requis' }, { status: 400 });
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

    // Vérifier si l'email existe déjà
    const existingResult = await db.query<any[]>(
      'SELECT * FROM user WHERE email = $email',
      { email: email.toLowerCase().trim() }
    );

    if ((existingResult[0] as any[])?.length > 0) {
      return json({ success: false, message: 'Cet email est déjà utilisé' }, { status: 409 });
    }

    // Générer mot de passe temporaire et slug
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const tutorSlug = generateTutorSlug(prenom, nom);

    // Créer le tuteur
    const tutorData = {
      email: email.toLowerCase().trim(),
      prenom,
      nom,
      name: `${prenom} ${nom}`,
      profile_type: 'tuteur',
      password_hash: passwordHash,
      tutor_slug: tutorSlug,
      created_by_establishment: establishment.id,
      is_admin: false,
      theme_color: 'gray',
      created_at: new Date().toISOString()
    };

    const created = await db.create('user', tutorData);
    const tutor = Array.isArray(created) ? created[0] : created;

    // Envoyer l'email d'invitation
    const establishmentName = establishment.name || `${establishment.prenom} ${establishment.nom}`;
    await sendTutorInviteEmail(
      email,
      prenom,
      establishmentName,
      tempPassword
    );

    return json({
      success: true,
      tutor: {
        id: tutor.id?.toString() || tutor.id,
        email: tutor.email,
        prenom: tutor.prenom,
        nom: tutor.nom
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Invite tutor error:', error);
    return json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
};
