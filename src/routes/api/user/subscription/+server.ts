/**
 * API pour gérer les abonnements utilisateur
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurrealDB } from '$lib/server/db';
import { SUBSCRIPTION_PLANS, isPaidPlan, isVipPlan, type SubscriptionPlan, type BillingCycle } from '$lib/types/subscription';

/**
 * GET - Récupérer les informations d'abonnement de l'utilisateur
 */
export const GET: RequestHandler = async ({ locals, cookies }) => {
  try {
    // Authentification
    let userId = locals.user?.id;
    if (!userId) {
      const userIdFromCookie = cookies.get('userId');
      if (userIdFromCookie) {
        userId = userIdFromCookie.includes(':') ? userIdFromCookie : `user:${userIdFromCookie}`;
      }
    }

    if (!userId) {
      return json({ error: 'Non authentifié' }, { status: 401 });
    }

    const db = await getSurrealDB();
    const cleanId = userId.includes(':') ? userId.split(':')[1] : userId;

    // Récupérer l'utilisateur avec son abonnement
    const [users] = await db.query(`
      SELECT 
        subscription_plan,
        subscription_billing_cycle,
        subscription_started_at,
        subscription_expires_at,
        subscription_auto_renew,
        subscription_history
      FROM user WHERE id = type::thing("user", $userId)
    `, { userId: cleanId });

    const user = Array.isArray(users) ? users[0] : users;
    
    if (!user) {
      return json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const currentPlan = (user.subscription_plan || 'free') as SubscriptionPlan;
    const billingCycle = (user.subscription_billing_cycle || 'monthly') as BillingCycle;
    const planDetails = SUBSCRIPTION_PLANS[currentPlan];

    return json({
      current_plan: currentPlan,
      billing_cycle: billingCycle,
      plan_details: planDetails,
      started_at: user.subscription_started_at,
      expires_at: user.subscription_expires_at,
      auto_renew: user.subscription_auto_renew ?? true,
      is_active: !user.subscription_expires_at || new Date(user.subscription_expires_at) > new Date(),
      history: user.subscription_history || []
    });

  } catch (error) {
    console.error('Erreur récupération abonnement:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

/**
 * POST - Changer d'abonnement
 */
export const POST: RequestHandler = async ({ request, locals, cookies }) => {
  try {
    // Authentification
    let userId = locals.user?.id;
    if (!userId) {
      const userIdFromCookie = cookies.get('userId');
      if (userIdFromCookie) {
        userId = userIdFromCookie.includes(':') ? userIdFromCookie : `user:${userIdFromCookie}`;
      }
    }

    if (!userId) {
      return json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { plan, billing_cycle = 'monthly' } = body as { plan: SubscriptionPlan; billing_cycle?: BillingCycle };

    // Vérifier que le plan existe
    if (!SUBSCRIPTION_PLANS[plan]) {
      return json({ error: 'Plan invalide' }, { status: 400 });
    }

    // Vérifier que le cycle est valide
    if (billing_cycle !== 'monthly' && billing_cycle !== 'yearly') {
      return json({ error: 'Cycle de facturation invalide' }, { status: 400 });
    }

    // Vérifier que ce n'est pas un plan VIP (admin uniquement)
    if (isVipPlan(plan)) {
      return json({ error: 'Ce plan ne peut être attribué que par un administrateur' }, { status: 403 });
    }

    const db = await getSurrealDB();
    const cleanId = userId.includes(':') ? userId.split(':')[1] : userId;

    // Récupérer l'utilisateur actuel
    const [users] = await db.query(`
      SELECT subscription_plan, subscription_billing_cycle, subscription_history, date_naissance
      FROM user WHERE id = type::thing("user", $userId)
    `, { userId: cleanId });

    const user = Array.isArray(users) ? users[0] : users;
    if (!user) {
      return json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const currentPlan = user.subscription_plan || 'free';
    
    // Si c'est le même plan et le même cycle, ne rien faire
    if (currentPlan === plan && user.subscription_billing_cycle === billing_cycle) {
      return json({ message: 'Vous avez déjà ce plan', plan });
    }

    // Calculer les dates
    const now = new Date();
    let expiresAt: Date | null = null;

    // Si c'est un plan payant, calculer la date d'expiration
    // La date d'anniversaire est la date de souscription (aujourd'hui)
    if (isPaidPlan(plan)) {
      expiresAt = new Date(now);
      if (billing_cycle === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }
    }

    // Mettre à jour l'historique
    const history = user.subscription_history || [];
    history.push({
      from_plan: currentPlan,
      to_plan: plan,
      changed_at: now.toISOString(),
      reason: 'user_change'
    });

    // Mettre à jour l'utilisateur
    const updateQuery = expiresAt
      ? `UPDATE user SET 
          subscription_plan = $plan,
          subscription_billing_cycle = $billingCycle,
          subscription_started_at = time::now(),
          subscription_expires_at = <datetime>$expiresAt,
          subscription_auto_renew = true,
          subscription_history = $history
        WHERE id = type::thing("user", $userId)`
      : `UPDATE user SET 
          subscription_plan = $plan,
          subscription_billing_cycle = $billingCycle,
          subscription_started_at = time::now(),
          subscription_expires_at = NONE,
          subscription_auto_renew = true,
          subscription_history = $history
        WHERE id = type::thing("user", $userId)`;

    await db.query(updateQuery, { 
      userId: cleanId, 
      plan,
      billingCycle: billing_cycle,
      expiresAt: expiresAt?.toISOString(),
      history 
    });

    // TODO: Si plan payant, rediriger vers le paiement Stripe
    // Pour l'instant, on simule juste le changement

    const price = billing_cycle === 'yearly' 
      ? SUBSCRIPTION_PLANS[plan].price_yearly 
      : SUBSCRIPTION_PLANS[plan].price_monthly;
    const cycleLabel = billing_cycle === 'yearly' ? 'an' : 'mois';

    return json({
      success: true,
      message: isPaidPlan(plan) 
        ? `Abonnement ${SUBSCRIPTION_PLANS[plan].name} activé (${billing_cycle === 'yearly' ? 'annuel' : 'mensuel'}). Vous serez facturé ${price}€/${cycleLabel}.`
        : `Vous êtes maintenant sur le plan ${SUBSCRIPTION_PLANS[plan].name}`,
      plan,
      billing_cycle,
      plan_details: SUBSCRIPTION_PLANS[plan],
      started_at: now.toISOString(),
      expires_at: expiresAt?.toISOString()
    });

  } catch (error) {
    console.error('Erreur changement abonnement:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};

/**
 * DELETE - Annuler l'abonnement (revenir au plan gratuit)
 */
export const DELETE: RequestHandler = async ({ locals, cookies }) => {
  try {
    // Authentification
    let userId = locals.user?.id;
    if (!userId) {
      const userIdFromCookie = cookies.get('userId');
      if (userIdFromCookie) {
        userId = userIdFromCookie.includes(':') ? userIdFromCookie : `user:${userIdFromCookie}`;
      }
    }

    if (!userId) {
      return json({ error: 'Non authentifié' }, { status: 401 });
    }

    const db = await getSurrealDB();
    const cleanId = userId.includes(':') ? userId.split(':')[1] : userId;

    // Récupérer l'utilisateur actuel
    const [users] = await db.query(`
      SELECT subscription_plan, subscription_history
      FROM user WHERE id = type::thing("user", $userId)
    `, { userId: cleanId });

    const user = Array.isArray(users) ? users[0] : users;
    if (!user) {
      return json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const currentPlan = user.subscription_plan || 'free';
    
    // Si c'est déjà le plan gratuit, ne rien faire
    if (currentPlan === 'free') {
      return json({ message: 'Vous êtes déjà sur le plan gratuit', plan: 'free' });
    }

    // Vérifier si c'est un plan VIP (ne peut pas être annulé par l'utilisateur)
    if (isVipPlan(currentPlan as SubscriptionPlan)) {
      return json({ error: 'Un plan VIP ne peut être modifié que par un administrateur' }, { status: 403 });
    }

    // Mettre à jour l'historique
    const history = user.subscription_history || [];
    history.push({
      from_plan: currentPlan,
      to_plan: 'free',
      changed_at: new Date().toISOString(),
      reason: 'user_cancel'
    });

    // Revenir au plan gratuit
    await db.query(`
      UPDATE user SET 
        subscription_plan = 'free',
        subscription_expires_at = NONE,
        subscription_auto_renew = false,
        subscription_history = $history
      WHERE id = type::thing("user", $userId)
    `, { userId: cleanId, history });

    return json({
      success: true,
      message: 'Votre abonnement a été annulé. Vous êtes maintenant sur le plan gratuit.',
      plan: 'free',
      plan_details: SUBSCRIPTION_PLANS.free
    });

  } catch (error) {
    console.error('Erreur annulation abonnement:', error);
    return json({ error: 'Erreur serveur' }, { status: 500 });
  }
};
