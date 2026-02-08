/**
 * API: Vérification email (via code OTP)
 * POST /api/auth/verify-email - Renvoie un code de vérification
 */
import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import { sendVerificationCode } from '$lib/server/email';
import type { RequestHandler } from './$types';

// Générer un code OTP à 6 chiffres
function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST: Renvoyer un email de vérification (code OTP)
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return json({ success: false, message: 'Email requis' }, { status: 400 });
    }

    const db = await connectDB();

    // Trouver l'utilisateur
    const userResult = await db.query<any[]>(`
      SELECT * FROM user WHERE email = $email
    `, { email: email.toLowerCase().trim() });

    const users = userResult[0] as any[];
    if (!users || users.length === 0) {
      // Ne pas révéler si l'email existe ou non
      return json({ 
        success: true, 
        message: 'Si cet email existe, un nouveau code a été envoyé.' 
      });
    }

    const user = users[0];

    if (user.email_verified) {
      return json({ 
        success: false, 
        message: 'Cet email est déjà vérifié.' 
      }, { status: 400 });
    }

    // Supprimer les anciens codes
    await db.query(`
      DELETE email_verification WHERE user = $userId
    `, { userId: user.id });

    // Créer un nouveau code OTP
    const otpCode = generateOTPCode();
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

    // Envoyer l'email avec le code
    await sendVerificationCode(user.email, user.prenom || 'utilisateur', otpCode);

    return json({ 
      success: true, 
      message: 'Un nouveau code de vérification a été envoyé à votre email.' 
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
};
