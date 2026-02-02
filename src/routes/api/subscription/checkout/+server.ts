/**
 * API: Créer une session Stripe Checkout pour un abonnement
 * POST /api/subscription/checkout
 */
import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import { createSubscriptionCheckoutSession, PLANS } from '$lib/server/stripe';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies, url }) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    const { plan } = await request.json();

    if (!plan || !['tutor', 'establishment'].includes(plan)) {
      return json({ success: false, message: 'Plan invalide' }, { status: 400 });
    }

    const db = await connectDB();

    // Vérifier la session et récupérer l'utilisateur
    const sessionResult = await db.query<any[]>(`
      SELECT user.* FROM session 
      WHERE session_token = $sessionToken 
      AND expires_at > time::now()
      FETCH user
    `, { sessionToken: sessionToken });

    const sessions = sessionResult[0] as any[];
    if (!sessions || sessions.length === 0) {
      return json({ success: false, message: 'Session invalide' }, { status: 401 });
    }

    const user = sessions[0].user;

    if (!user.email) {
      return json({ success: false, message: 'Email requis pour souscrire' }, { status: 400 });
    }

    // Vérifier si l'utilisateur a déjà un abonnement actif
    const subResult = await db.query<any[]>(`
      SELECT * FROM user_subscription 
      WHERE user = $userId 
      AND status IN ['active', 'trialing']
      LIMIT 1
    `, { userId: user.id });

    if ((subResult[0] as any[])?.length > 0) {
      return json({ 
        success: false, 
        message: 'Vous avez déjà un abonnement actif. Gérez-le depuis votre profil.' 
      }, { status: 400 });
    }

    // Créer la session Stripe Checkout
    const baseUrl = url.origin;
    const checkoutSession = await createSubscriptionCheckoutSession({
      plan: plan as 'tutor' | 'establishment',
      userId: user.id.toString(),
      userEmail: user.email,
      successUrl: `${baseUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/upgrade?canceled=true`
    });

    return json({
      success: true,
      checkoutUrl: checkoutSession.url
    });

  } catch (error) {
    console.error('Subscription checkout error:', error);
    return json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
};
