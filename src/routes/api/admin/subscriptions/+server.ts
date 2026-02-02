/**
 * API Admin pour gérer les abonnements VIP
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '$lib/types/subscription';

/**
 * POST - Attribuer un plan VIP à un utilisateur (admin uniquement)
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!locals.user?.is_admin) {
      return json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, plan, reason } = body as { 
      userId: string; 
      plan: SubscriptionPlan; 
      reason?: string;
    };

    // Vérifier que le plan existe
    if (!SUBSCRIPTION_PLANS[plan]) {
      return json({ error: 'Plan invalide' }, { status: 400 });
    }

    const db = await getSurrealDB();
    const cleanId = userId.includes(':') ? userId.split(':')[1] : userId;
    const adminId = locals.user.id.includes(':') ? locals.user.id.split(':')[1] : locals.user.id;

    // Récupérer l'utilisateur cible
    const [users] = await db.query(`
      SELECT id, email, name, subscription_plan, subscription_history
      FROM user WHERE id = type::thing("user", $userId)
    `, { userId: cleanId });

    const user = Array.isArray(users) ? users[0] : users;
    if (!user) {
      return json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const currentPlan = user.subscription_plan || 'free';

    // Mettre à jour l'historique
    const history = user.subscription_history || [];
    history.push({
      from_plan: currentPlan,
      to_plan: plan,
      changed_at: new Date().toISOString(),
      reason: reason || 'admin_assignment',
      assigned_by: `user:${adminId}`
    });

    // Mettre à jour l'utilisateur
    await db.query(`
      UPDATE user SET 
        subscription_plan = $plan,
        subscription_started_at = time::now(),
        subscription_expires_at = NONE,
        subscription_auto_renew = false,
        subscription_assigned_by = type::thing("user", $adminId),
        subscription_history = $history
      WHERE id = type::thing("user", $userId)
    `, { userId: cleanId, adminId, plan, history });

    return json({
      success: true,
      message: `Plan ${SUBSCRIPTION_PLANS[plan].name} attribué à ${user.email || user.name}`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      plan,
      plan_details: SUBSCRIPTION_PLANS[plan]
    });

  } catch (error) {
    console.error('Erreur attribution plan VIP:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

/**
 * GET - Lister les utilisateurs avec plans VIP (admin uniquement)
 */
export const GET: RequestHandler = async ({ locals, url }) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!locals.user?.is_admin) {
      return json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const db = await getSurrealDB();
    const planFilter = url.searchParams.get('plan');

    let query = `
      SELECT id, email, name, subscription_plan, subscription_started_at, subscription_assigned_by
      FROM user 
      WHERE subscription_plan IN ['tutor_vip', 'establishment_vip']
    `;

    if (planFilter) {
      query = `
        SELECT id, email, name, subscription_plan, subscription_started_at, subscription_assigned_by
        FROM user 
        WHERE subscription_plan = $plan
      `;
    }

    const [users] = await db.query(query, { plan: planFilter });

    return json({
      users: users || [],
      total: Array.isArray(users) ? users.length : 0
    });

  } catch (error) {
    console.error('Erreur liste VIP:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

/**
 * DELETE - Retirer un plan VIP (admin uniquement)
 */
export const DELETE: RequestHandler = async ({ request, locals }) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!locals.user?.is_admin) {
      return json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, reason } = body as { userId: string; reason?: string };

    const db = await getSurrealDB();
    const cleanId = userId.includes(':') ? userId.split(':')[1] : userId;
    const adminId = locals.user.id.includes(':') ? locals.user.id.split(':')[1] : locals.user.id;

    // Récupérer l'utilisateur cible
    const [users] = await db.query(`
      SELECT id, email, name, subscription_plan, subscription_history
      FROM user WHERE id = type::thing("user", $userId)
    `, { userId: cleanId });

    const user = Array.isArray(users) ? users[0] : users;
    if (!user) {
      return json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const currentPlan = user.subscription_plan || 'free';

    // Mettre à jour l'historique
    const history = user.subscription_history || [];
    history.push({
      from_plan: currentPlan,
      to_plan: 'free',
      changed_at: new Date().toISOString(),
      reason: reason || 'admin_revoke',
      revoked_by: `user:${adminId}`
    });

    // Revenir au plan gratuit
    await db.query(`
      UPDATE user SET 
        subscription_plan = 'free',
        subscription_expires_at = NONE,
        subscription_auto_renew = false,
        subscription_assigned_by = NONE,
        subscription_history = $history
      WHERE id = type::thing("user", $userId)
    `, { userId: cleanId, history });

    return json({
      success: true,
      message: `Plan VIP retiré de ${user.email || user.name}. L'utilisateur est maintenant sur le plan gratuit.`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Erreur retrait plan VIP:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
