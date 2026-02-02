import { json, error } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { uploadToCloudflare, deleteFromCloudflare } from "$lib/cloudflare";
import { connectDB } from "$lib/db";

export const POST = async ({ request, cookies, locals }: RequestEvent) => {
  try {
    // Récupérer l'utilisateur depuis locals (hooks) ou cookie ou header
    let currentUser = (locals as any).user;
    
    if (!currentUser) {
      const userCookie = cookies.get('user');
      if (userCookie) {
        try {
          currentUser = JSON.parse(userCookie);
        } catch (e) {
          // ignore
        }
      }
    }
    
    if (!currentUser) {
      // Essayer de récupérer depuis le header X-User-Id
      const userIdHeader = request.headers.get('X-User-Id');
      if (userIdHeader) {
        currentUser = { id: userIdHeader };
      }
    }
    
    if (!currentUser) {
      return error(401, { message: 'Non authentifié' });
    }

    const userId = currentUser.id;
    if (!userId) {
      return error(401, { message: 'Utilisateur non trouvé' });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const avatarPreset = formData.get('avatarPreset') as string | null;

    const db = await connectDB();
    const cleanId = userId.includes(':') ? userId.split(':')[1] : userId;

    let avatarUrl: string;

    if (avatarPreset) {
      // Avatar prédéfini sélectionné
      avatarUrl = avatarPreset;
    } else if (file) {
      // Upload de fichier vers Cloudflare R2
      // Vérifier le type de fichier
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return error(400, { message: 'Type de fichier non autorisé. Utilisez JPEG, PNG, WebP ou GIF.' });
      }

      // Vérifier la taille (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return error(400, { message: 'Fichier trop volumineux. Maximum 5MB.' });
      }

      // Récupérer l'ancien avatar pour le supprimer ensuite
      const existingUser = await db.query<any[]>(
        `SELECT avatar_url FROM user:${cleanId}`
      );
      const oldAvatarUrl = existingUser[0]?.[0]?.avatar_url;

      // Uploader dans le dossier de l'utilisateur : users/{userId}/avatars/
      const folder = `users/${cleanId}/avatars`;
      const result = await uploadToCloudflare(file, folder);
      avatarUrl = result.url;

      // Supprimer l'ancien avatar s'il existe et n'est pas un preset
      if (oldAvatarUrl && oldAvatarUrl.includes(`users/${cleanId}/avatars`)) {
        try {
          // Extraire la clé depuis l'URL
          const oldKey = oldAvatarUrl.split('/').slice(-3).join('/'); // users/{id}/avatars/filename
          await deleteFromCloudflare(oldKey);
        } catch (e) {
          console.warn('Could not delete old avatar:', e);
        }
      }
    } else {
      return error(400, { message: 'Aucun avatar fourni' });
    }

    // Mettre à jour l'utilisateur dans la base de données
    const result = await db.query(
      `UPDATE user:${cleanId} SET avatar_url = $avatar_url, updatedAt = time::now() RETURN *`,
      { avatar_url: avatarUrl }
    );

    const updatedUser = Array.isArray(result[0]) ? result[0][0] : result[0];

    if (!updatedUser) {
      return error(404, { message: 'Utilisateur non trouvé' });
    }

    // Mettre à jour le cookie
    const userForCookie = {
      ...currentUser,
      avatar_url: avatarUrl
    };
    
    cookies.set('user', JSON.stringify(userForCookie), {
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 semaine
    });

    return json({ 
      success: true, 
      avatar_url: avatarUrl,
      user: userForCookie
    });
  } catch (e) {
    console.error('Avatar upload error:', e);
    return error(500, { message: 'Erreur lors du changement d\'avatar' });
  }
};

// Supprimer l'avatar (réinitialiser)
export const DELETE = async ({ cookies, locals, request }: RequestEvent) => {
  try {
    let currentUser = (locals as any).user;
    
    if (!currentUser) {
      const userCookie = cookies.get('user');
      if (userCookie) {
        try {
          currentUser = JSON.parse(userCookie);
        } catch (e) {
          // ignore
        }
      }
    }
    
    if (!currentUser) {
      const userIdHeader = request.headers.get('X-User-Id');
      if (userIdHeader) {
        currentUser = { id: userIdHeader };
      }
    }
    
    if (!currentUser) {
      return error(401, { message: 'Non authentifié' });
    }

    const userId = currentUser.id;
    if (!userId) {
      return error(401, { message: 'Utilisateur non trouvé' });
    }

    const db = await connectDB();
    const cleanId = userId.includes(':') ? userId.split(':')[1] : userId;

    // Récupérer l'ancien avatar
    const existingUser = await db.query<any[]>(
      `SELECT avatar_url FROM user:${cleanId}`
    );
    const oldAvatarUrl = existingUser[0]?.[0]?.avatar_url;

    // Supprimer l'ancien avatar de Cloudflare s'il existe
    if (oldAvatarUrl && oldAvatarUrl.includes(`users/${cleanId}/avatars`)) {
      try {
        const oldKey = oldAvatarUrl.split('/').slice(-3).join('/');
        await deleteFromCloudflare(oldKey);
      } catch (e) {
        console.warn('Could not delete old avatar:', e);
      }
    }

    // Réinitialiser avatar_url à null
    await db.query(
      `UPDATE user:${cleanId} SET avatar_url = NONE, updatedAt = time::now()`
    );

    // Mettre à jour le cookie
    const userForCookie = {
      ...currentUser,
      avatar_url: null
    };
    delete userForCookie.avatar_url;
    
    cookies.set('user', JSON.stringify(userForCookie), {
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });

    return json({ success: true });
  } catch (e) {
    console.error('Avatar delete error:', e);
    return error(500, { message: 'Erreur lors de la suppression de l\'avatar' });
  }
};
