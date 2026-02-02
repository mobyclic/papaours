/**
 * API: Vérification email
 * GET /api/auth/verify-email?token=xxx - Vérifie le token et active le compte
 */
import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const token = url.searchParams.get('token');
    
    if (!token) {
      return json({ success: false, message: 'Token manquant' }, { status: 400 });
    }

    const db = await connectDB();

    // Vérifier le token
    const tokenResult = await db.query<any[]>(`
      SELECT * FROM email_verification 
      WHERE verification_token = $verificationToken 
      AND expires_at > time::now()
      AND used = false OR used = NONE
    `, { verificationToken: token });

    const verifications = tokenResult[0] as any[];
    if (!verifications || verifications.length === 0) {
      return json({ 
        success: false, 
        message: 'Token invalide ou expiré. Veuillez vous réinscrire.' 
      }, { status: 400 });
    }

    const verification = verifications[0];
    
    // Marquer l'email comme vérifié
    await db.query(`
      UPDATE user SET email_verified = true WHERE id = $userId
    `, { userId: verification.user });

    // Marquer le token comme utilisé
    await db.query(`
      UPDATE email_verification SET used = true WHERE verification_token = $verificationToken
    `, { verificationToken: token });

    return json({ 
      success: true, 
      message: 'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.' 
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
};

// POST: Renvoyer un email de vérification
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
        message: 'Si cet email existe, un nouveau lien de vérification a été envoyé.' 
      });
    }

    const user = users[0];

    if (user.email_verified) {
      return json({ 
        success: false, 
        message: 'Cet email est déjà vérifié.' 
      }, { status: 400 });
    }

    // Supprimer les anciens tokens
    await db.query(`
      DELETE email_verification WHERE user = $userId
    `, { userId: user.id });

    // Créer un nouveau token
    const verificationToken = crypto.randomUUID();
    await db.query(`
      CREATE email_verification SET 
        verification_token = $verificationToken,
        user = $userId,
        created_at = time::now(),
        expires_at = time::now() + 24h
    `, { 
      verificationToken: verificationToken,
      userId: user.id 
    });

    // Envoyer l'email
    const { sendVerificationEmail } = await import('$lib/server/email');
    await sendVerificationEmail(user.email, user.prenom, verificationToken);

    return json({ 
      success: true, 
      message: 'Un nouveau lien de vérification a été envoyé à votre email.' 
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
};
