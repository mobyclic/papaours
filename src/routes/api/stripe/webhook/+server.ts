import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

const stripe = new Stripe(env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia'
});

export const POST: RequestHandler = async ({ request }) => {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  try {
    const body = await request.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Traiter les événements
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('✅ Don reçu:', {
          amount: session.amount_total ? session.amount_total / 100 : 0,
          donor: session.metadata?.donor_name,
          message: session.metadata?.message,
          email: session.customer_details?.email
        });
        
        // TODO: Enregistrer le don en base de données si nécessaire
        // TODO: Envoyer un email de remerciement
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('❌ Paiement échoué:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Événement non géré: ${event.type}`);
    }

    return json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return json({ 
      error: error instanceof Error ? error.message : 'Webhook error' 
    }, { status: 400 });
  }
};
