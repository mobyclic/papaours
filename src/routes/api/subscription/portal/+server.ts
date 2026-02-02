/**
 * API: Créer une session du portail client Stripe
 * POST /api/subscription/portal
 * Permet aux utilisateurs de gérer leur abonnement
 */
import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import { createBillingPortalSession } from '$lib/server/stripe';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, url }) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ success: false, message: 'Non authentifié' }, { status: 401 });
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

    if (!user.stripe_customer_id) {
      return json({ 
        success: false, 
        message: 'Pas d\'abonnement actif' 
      }, { status: 400 });
    }

    // Créer la session du portail
    const portalSession = await createBillingPortalSession(
      user.stripe_customer_id,
      `${url.origin}/settings`
    );

    return json({
      success: true,
      portalUrl: portalSession.url
    });

  } catch (error) {
    console.error('Billing portal error:', error);
    return json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
};
