/**
 * API: Vérifier une session de checkout Stripe
 * GET /api/subscription/verify?session_id=xxx
 */
import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import { getCheckoutSession } from '$lib/server/stripe';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    const sessionId = url.searchParams.get('session_id');
    
    if (!sessionId) {
      return json({ success: false, message: 'Session ID requis' }, { status: 400 });
    }

    // Récupérer la session Stripe
    const checkoutSession = await getCheckoutSession(sessionId);

    if (checkoutSession.payment_status !== 'paid') {
      return json({ success: false, message: 'Paiement non confirmé' }, { status: 400 });
    }

    const plan = checkoutSession.metadata?.plan;
    const userId = checkoutSession.metadata?.user_id;

    if (!plan || !userId) {
      return json({ success: false, message: 'Données de session invalides' }, { status: 400 });
    }

    // Récupérer l'utilisateur mis à jour
    const db = await connectDB();
    const userResult = await db.query<any[]>(`
      SELECT * FROM user WHERE id = type::thing("user", $userId)
    `, { userId: userId.includes(':') ? userId.split(':')[1] : userId });

    const users = userResult[0] as any[];
    const user = users?.[0];

    if (!user) {
      return json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return json({
      success: true,
      plan,
      user: {
        id: user.id?.toString() || user.id,
        email: user.email,
        name: user.name,
        profile_type: user.profile_type,
        tutor_slug: user.tutor_slug
      }
    });

  } catch (error) {
    console.error('Verify subscription error:', error);
    return json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
};
