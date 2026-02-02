import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// Hash simple pour le mot de passe (doit correspondre à celui du signup)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'kweez_salt_2024');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email) {
      return json({ message: 'Email requis' }, { status: 400 });
    }

    if (!password) {
      return json({ message: 'Mot de passe requis' }, { status: 400 });
    }

    const db = await connectDB();

    // Chercher par email (tous les utilisateurs avec email+password)
    const result = await db.query<any[]>(
      `SELECT * FROM user WHERE email = $email AND password_hash IS NOT NONE`,
      { email: email.toLowerCase().trim() }
    );

    const users = result[0] as any[];

    if (!users || users.length === 0) {
      return json({ message: "Email introuvable" }, { status: 404 });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const passwordHash = await hashPassword(password);
    if (user.password_hash !== passwordHash) {
      return json({ message: 'Mot de passe incorrect' }, { status: 401 });
    }

    // Vérifier que l'email est validé
    if (!user.email_verified) {
      return json({ 
        message: 'Veuillez vérifier votre email avant de vous connecter',
        requiresVerification: true,
        email: user.email
      }, { status: 403 });
    }

    // Mettre à jour last_login
    await db.query(`
      UPDATE $userId SET last_login = time::now()
    `, { userId: user.id });

    // Créer une session
    const sessionToken = crypto.randomUUID();
    await db.query(`
      CREATE session SET 
        session_token = $sessionToken,
        user = $userId,
        created_at = time::now(),
        expires_at = time::now() + 30d
    `, { 
      sessionToken: sessionToken,
      userId: user.id 
    });

    // Définir le cookie de session
    cookies.set('session', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 jours
    });

    return json({
      success: true,
      user: {
        id: user.id?.toString() || user.id,
        email: user.email,
        name: user.name,
        nom: user.nom,
        prenom: user.prenom,
        theme_color: user.theme_color || 'gray',
        profile_type: user.profile_type || 'apprenant',
        tutor_slug: user.tutor_slug || null,
        global_student_id: user.global_student_id || null,
        is_admin: !!user.is_admin,
        onboarding_completed: !!user.onboarding_completed,
        education_system: user.education_system?.toString() || null,
        current_cycle: user.current_cycle?.toString() || null,
        current_grade: user.current_grade?.toString() || null,
        current_track: user.current_track?.toString() || null,
        specialties: user.specialties?.map((s: any) => s?.toString() || s) || []
      }
    });

  } catch (error) {
    console.error('Auth login error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
