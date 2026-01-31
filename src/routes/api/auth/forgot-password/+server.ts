/**
 * API: Demande de réinitialisation de mot de passe (tuteurs uniquement)
 * POST /api/auth/forgot-password
 */
import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import { sendPasswordResetEmail } from '$lib/server/email';
import type { RequestHandler } from './$types';

// Génère un token aléatoire sécurisé
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return json({ message: 'Email requis' }, { status: 400 });
    }

    const db = await connectDB();

    // Chercher le tuteur par email
    const result = await db.query<any[]>(
      `SELECT * FROM user WHERE email = $email AND user_type = 'tuteur'`,
      { email }
    );

    const users = result[0] as any[];

    // Pour des raisons de sécurité, on retourne toujours un succès
    // même si l'email n'existe pas (évite l'énumération des comptes)
    if (!users || users.length === 0) {
      console.log(`[forgot-password] Email non trouvé ou non tuteur: ${email}`);
      return json({ 
        success: true, 
        message: 'Si cet email existe, vous recevrez un lien de réinitialisation.' 
      });
    }

    const user = users[0];
    const userId = user.id.toString();

    // Invalider les anciens tokens
    await db.query(
      `UPDATE password_reset_token SET used = true WHERE user_id = type::thing('user', $userId) AND used = false`,
      { userId: userId.split(':')[1] }
    );

    // Créer un nouveau token (expire dans 1 heure)
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await db.query(
      `CREATE password_reset_token SET 
        user_id = type::thing('user', $userId),
        token = $token,
        expires_at = $expiresAt,
        used = false`,
      { 
        userId: userId.split(':')[1],
        token,
        expiresAt
      }
    );

    // Envoyer l'email
    const emailResult = await sendPasswordResetEmail(
      email,
      token,
      user.prenom || user.name || 'Tuteur'
    );

    if (!emailResult.success) {
      console.error(`[forgot-password] Échec envoi email: ${emailResult.error}`);
      // On ne révèle pas l'erreur à l'utilisateur
    }

    return json({ 
      success: true, 
      message: 'Si cet email existe, vous recevrez un lien de réinitialisation.' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
