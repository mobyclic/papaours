/**
 * API: Vérification du code OTP
 * POST /api/auth/verify-otp
 */
import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return json({ message: 'Email et code requis' }, { status: 400 });
    }

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return json({ message: 'Code invalide' }, { status: 400 });
    }

    const db = await connectDB();

    // Chercher l'utilisateur par email
    const userResult = await db.query<any[]>(
      'SELECT * FROM user WHERE email = $email',
      { email: email.toLowerCase().trim() }
    );

    const users = userResult[0] as any[];
    if (!users || users.length === 0) {
      return json({ message: 'Utilisateur introuvable' }, { status: 404 });
    }

    const user = users[0];

    // Vérifier si déjà vérifié
    if (user.email_verified) {
      return json({ message: 'Email déjà vérifié' }, { status: 400 });
    }

    // Chercher le code de vérification valide
    const verificationResult = await db.query<any[]>(
      `SELECT * FROM email_verification 
       WHERE user = $userId 
       AND verification_code = $code 
       AND expires_at > time::now()
       ORDER BY created_at DESC
       LIMIT 1`,
      { userId: user.id, code }
    );

    const verifications = verificationResult[0] as any[];
    if (!verifications || verifications.length === 0) {
      return json({ message: 'Code invalide ou expiré' }, { status: 400 });
    }

    // Marquer l'email comme vérifié
    await db.query(
      `UPDATE $userId SET email_verified = true`,
      { userId: user.id }
    );

    // Supprimer les codes de vérification utilisés
    await db.query(
      `DELETE email_verification WHERE user = $userId`,
      { userId: user.id }
    );

    // Créer une session pour l'utilisateur
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
      message: 'Email vérifié avec succès',
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
        onboarding_completed: false, // Nouveau compte, pas d'onboarding
        education_system: null,
        current_cycle: null,
        current_grade: null,
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
