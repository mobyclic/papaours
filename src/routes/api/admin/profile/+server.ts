/**
 * API de gestion du profil admin
 */

import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import { getBackofficeUser } from '$lib/server/backoffice-auth';
import bcrypt from 'bcryptjs';
import type { RequestHandler } from './$types';

// PATCH - Mettre à jour le profil
export const PATCH: RequestHandler = async ({ request, cookies }) => {
  try {
    const user = await getBackofficeUser(cookies);
    
    if (!user) {
      return json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    const db = await connectDB();
    const cleanUserId = user.id.includes(':') ? user.id.split(':')[1] : user.id;

    // Mise à jour de l'email
    if (email !== undefined) {
      // Vérifier que l'email n'est pas déjà utilisé
      const [existingUsers] = await db.query<[any[]]>(
        'SELECT id FROM backoffice_user WHERE email = $email AND id != type::thing("backoffice_user", $userId)',
        { email: email.toLowerCase().trim(), userId: cleanUserId }
      );

      if (existingUsers?.length > 0) {
        return json({ error: 'Cette adresse email est déjà utilisée' }, { status: 400 });
      }

      await db.query(
        'UPDATE type::thing("backoffice_user", $userId) SET email = $email',
        { userId: cleanUserId, email: email.toLowerCase().trim() }
      );

      return json({ success: true, message: 'Email mis à jour' });
    }

    // Mise à jour du mot de passe
    if (currentPassword && newPassword) {
      // Récupérer le mot de passe actuel
      const [users] = await db.query<[any[]]>(
        'SELECT password FROM backoffice_user WHERE id = type::thing("backoffice_user", $userId)',
        { userId: cleanUserId }
      );

      const userData = users?.[0];
      if (!userData) {
        return json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      }

      // Vérifier le mot de passe actuel
      const passwordMatch = await bcrypt.compare(currentPassword, userData.password);
      if (!passwordMatch) {
        return json({ error: 'Mot de passe actuel incorrect' }, { status: 400 });
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.query(
        'UPDATE type::thing("backoffice_user", $userId) SET password = $password',
        { userId: cleanUserId, password: hashedPassword }
      );

      return json({ success: true, message: 'Mot de passe mis à jour' });
    }

    return json({ error: 'Aucune modification fournie' }, { status: 400 });

  } catch (error) {
    console.error('Profile update error:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
