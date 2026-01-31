/**
 * API pour vérifier une session de paiement Stripe et enregistrer le don
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCheckoutSession } from '$lib/server/stripe';
import { getSurrealDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId) {
    return json({ error: 'Session ID manquant' }, { status: 400 });
  }

  try {
    const session = await getCheckoutSession(sessionId);

    if (session.payment_status !== 'paid') {
      return json({ error: 'Paiement non confirmé' }, { status: 400 });
    }

    // Enregistrer le don en base (si pas déjà fait)
    try {
      const db = await getSurrealDB();
      
      // Vérifier si le don existe déjà
      const existing = await db.query<any[][]>(`
        SELECT id FROM donation WHERE stripe_session_id = $sessionId LIMIT 1
      `, { sessionId });

      if (!existing[0]?.length) {
        // Créer le don
        await db.query(`
          CREATE donation SET
            stripe_session_id = $sessionId,
            amount = $amount,
            donor_name = $donorName,
            donor_email = $donorEmail,
            message = $message,
            is_public = true,
            created_at = time::now()
        `, {
          sessionId,
          amount: session.amount_total || 0,
          donorName: session.metadata?.donor_name || null,
          donorEmail: session.customer_email || null,
          message: session.metadata?.message || null
        });
        console.log('✅ Don enregistré:', sessionId);
      }
    } catch (dbError) {
      console.error('Erreur enregistrement don:', dbError);
      // On ne bloque pas la réponse pour autant
    }

    return json({
      amount: session.amount_total,
      email: session.customer_email,
      name: session.metadata?.donor_name,
      message: session.metadata?.message
    });
  } catch (error) {
    console.error('Erreur vérification Stripe:', error);
    return json({ error: 'Session introuvable' }, { status: 404 });
  }
};
