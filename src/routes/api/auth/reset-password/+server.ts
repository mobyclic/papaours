/**
 * API: Réinitialisation effective du mot de passe
 * POST /api/auth/reset-password
 */
import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// Hash (doit correspondre à signup)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'kwizy_salt_2024');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { token, password } = await request.json();

    if (!token) {
      return json({ message: 'Token requis' }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return json({ message: 'Mot de passe de 8 caractères minimum requis' }, { status: 400 });
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return json({ message: 'Le mot de passe doit contenir une majuscule, une minuscule et un chiffre' }, { status: 400 });
    }

    const db = await connectDB();

    // Vérifier le token
    const result = await db.query<any[]>(
      `SELECT *, user_id.* as user FROM password_reset_token 
       WHERE reset_token = $resetToken AND used = false AND expires_at > time::now()`,
      { resetToken: token }
    );

    const tokens = result[0] as any[];

    if (!tokens || tokens.length === 0) {
      return json({ message: 'Lien invalide ou expiré' }, { status: 400 });
    }

    const resetToken = tokens[0];
    const userId = resetToken.user_id.toString();

    // Hasher le nouveau mot de passe
    const passwordHash = await hashPassword(password);

    // Mettre à jour le mot de passe
    await db.query(
      `UPDATE type::thing('user', $userId) SET password_hash = $passwordHash`,
      { 
        userId: userId.split(':')[1],
        passwordHash 
      }
    );

    // Marquer le token comme utilisé
    await db.query(
      `UPDATE password_reset_token SET used = true WHERE reset_token = $resetToken`,
      { resetToken: token }
    );

    return json({ 
      success: true, 
      message: 'Mot de passe modifié avec succès' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return json({ message: 'Erreur serveur' }, { status: 500 });
  }
};
