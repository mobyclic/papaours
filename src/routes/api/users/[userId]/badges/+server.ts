/**
 * API: Récupérer les badges d'un utilisateur
 * GET /api/users/[userId]/badges
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';
import { getUserBadges, getUnnotifiedBadges, markBadgesAsNotified } from '$lib/server/badges';

export const GET: RequestHandler = async ({ params }) => {
  const { userId } = params;
  
  if (!userId) {
    return json({ error: 'userId requis' }, { status: 400 });
  }

  const db = await getSurrealDB();

  try {
    const badges = await getUserBadges(db, userId);
    const unnotified = await getUnnotifiedBadges(db, userId);

    return json({
      ...badges,
      unnotified
    });
  } catch (error) {
    console.error('Erreur API badges:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

/**
 * POST /api/users/[userId]/badges
 * Marquer des badges comme notifiés
 */
export const POST: RequestHandler = async ({ params, request }) => {
  const { userId } = params;
  
  if (!userId) {
    return json({ error: 'userId requis' }, { status: 400 });
  }

  const db = await getSurrealDB();

  try {
    const body = await request.json();
    const { badgeIds } = body;

    if (badgeIds && Array.isArray(badgeIds)) {
      await markBadgesAsNotified(db, userId, badgeIds);
    }

    return json({ success: true });
  } catch (error) {
    console.error('Erreur API badges POST:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
