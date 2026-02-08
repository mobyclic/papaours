/**
 * API: Renvoyer le code OTP de vérification
 * POST /api/auth/resend-otp
 */
import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import { sendVerificationCode } from '$lib/server/email';
import type { RequestHandler } from './$types';

// Générer un code OTP à 6 chiffres
function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return json({ message: 'Email requis' }, { status: 400 });
    }

    const db = await connectDB();

    // Chercher l'utilisateur par email
    const userResult = await db.query<any[]>(
      'SELECT * FROM user WHERE email = $email',
      { email: email.toLowerCase().trim() }
    );

    const users = userResult[0] as any[];
    if (!users || users.length === 0) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return json({ 
        success: true, 
        message: 'Si un compte existe avec cet email, un nouveau code a été envoyé.'
      });
    }

    const user = users[0];

    // Vérifier si déjà vérifié
    if (user.email_verified) {
      return json({ message: 'Cet email est déjà vérifié. Vous pouvez vous connecter.' }, { status: 400 });
    }

    // Vérifier le rate limiting (pas plus d'un code toutes les 2 minutes)
    const recentCodeResult = await db.query<any[]>(
      `SELECT * FROM email_verification 
       WHERE user = $userId 
       AND created_at > time::now() - 2m
       ORDER BY created_at DESC
       LIMIT 1`,
      { userId: user.id }
    );

    const recentCodes = recentCodeResult[0] as any[];
    if (recentCodes && recentCodes.length > 0) {
      return json({ 
        message: 'Veuillez attendre 2 minutes avant de demander un nouveau code.',
        retryAfter: 120
      }, { status: 429 });
    }

    // Supprimer les anciens codes
    await db.query(
      `DELETE email_verification WHERE user = $userId`,
      { userId: user.id }
    );

    // Générer un nouveau code OTP
    const otpCode = generateOTPCode();

    // Créer le nouveau token de vérification
    await db.query(`
      CREATE email_verification SET 
        verification_code = $otpCode,
        user = $userId,
        created_at = time::now(),
        expires_at = time::now() + 15m
    `, { 
      otpCode: otpCode,
      userId: user.id 
    });

    // Envoyer l'email avec le nouveau code
    await sendVerificationCode(email.toLowerCase().trim(), user.prenom || 'utilisateur', otpCode);

    return json({
      success: true,
      message: 'Un nouveau code a été envoyé à votre adresse email.'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
