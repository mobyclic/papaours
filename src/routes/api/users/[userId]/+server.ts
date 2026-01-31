import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import type { RequestHandler } from './$types';

// GET: Récupérer un utilisateur
export const GET: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    const userId = params.userId;
    const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;

    const result = await db.query<any[]>(`
      SELECT * FROM type::thing("user", $userId)
    `, { userId: cleanUserId });

    const user = (result[0] as any[])?.[0];
    
    if (!user) {
      return json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return json({ 
      user: {
        id: user.id?.toString(),
        name: user.name,
        email: user.email,
        pseudo: user.pseudo,
        classe: user.classe,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return json({ error: 'Erreur lors du chargement' }, { status: 500 });
  }
};

// PATCH: Mettre à jour un utilisateur
export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const db = await connectDB();
    const userId = params.userId;
    const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;
    
    const body = await request.json();
    const { name, pseudo, classe, theme_color } = body;

    // Construire la requête de mise à jour
    const updates: string[] = [];
    const updateParams: Record<string, any> = { userId: cleanUserId };

    if (name !== undefined) {
      updates.push('name = $name');
      updateParams.name = name;
    }
    if (pseudo !== undefined) {
      updates.push('pseudo = $pseudo');
      updateParams.pseudo = pseudo;
    }
    if (classe !== undefined) {
      updates.push('classe = $classe');
      updateParams.classe = classe;
    }
    if (theme_color !== undefined) {
      updates.push('theme_color = $theme_color');
      updateParams.theme_color = theme_color;
    }

    if (updates.length === 0) {
      return json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 });
    }

    updates.push('updated_at = time::now()');

    const query = `UPDATE type::thing("user", $userId) SET ${updates.join(', ')}`;
    const result = await db.query<any[]>(query, updateParams);

    const user = (result[0] as any[])?.[0];

    return json({ 
      success: true,
      user: {
        id: user?.id?.toString(),
        name: user?.name,
        pseudo: user?.pseudo,
        classe: user?.classe,
        theme_color: user?.theme_color
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
};

// DELETE: Supprimer un utilisateur et ses données
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const db = await connectDB();
    const userId = params.userId;
    const cleanUserId = userId.includes(':') ? userId.split(':')[1] : userId;

    // Supprimer dans l'ordre pour respecter les contraintes
    // 1. Favoris
    await db.query(`DELETE user_favorite WHERE user_id = type::thing("user", $userId)`, { userId: cleanUserId });
    
    // 2. Badges
    await db.query(`DELETE user_badge WHERE user_id = type::thing("user", $userId)`, { userId: cleanUserId });
    
    // 3. Sessions de quiz
    await db.query(`DELETE quiz_session WHERE userId = $userIdStr OR userId = $userIdFull`, { 
      userIdStr: cleanUserId,
      userIdFull: `user:${cleanUserId}`
    });
    
    // 4. Résultats de quiz
    await db.query(`DELETE quiz_result WHERE userId = $userIdStr OR userId = $userIdFull`, { 
      userIdStr: cleanUserId,
      userIdFull: `user:${cleanUserId}`
    });
    
    // 5. Progression
    await db.query(`DELETE user_progress WHERE user_id = type::thing("user", $userId)`, { userId: cleanUserId });
    
    // 6. L'utilisateur lui-même
    await db.query(`DELETE type::thing("user", $userId)`, { userId: cleanUserId });

    return json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
};
