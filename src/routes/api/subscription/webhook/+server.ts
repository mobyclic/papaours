/**
 * API: Webhook Stripe
 * POST /api/subscription/webhook
 * 
 * Gère les événements Stripe:
 * - checkout.session.completed (abonnement créé)
 * - customer.subscription.updated (changement de plan)
 * - customer.subscription.deleted (annulation)
 * - invoice.payment_failed (échec de paiement)
 */
import { json, text } from '@sveltejs/kit';
import { connectDB } from '$lib/db';
import { stripe } from '$lib/server/stripe';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import type Stripe from 'stripe';

const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('[Webhook] Missing stripe-signature header');
    return text('Missing signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET || '');
  } catch (err: any) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return text(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`[Webhook] Received event: ${event.type}`);

  const db = await connectDB();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Vérifier que c'est un abonnement
        if (session.mode !== 'subscription' || session.metadata?.type !== 'subscription') {
          console.log('[Webhook] Not a subscription checkout, skipping');
          break;
        }

        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan as 'tutor' | 'establishment';
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId || !plan) {
          console.error('[Webhook] Missing user_id or plan in metadata');
          break;
        }

        console.log(`[Webhook] Processing subscription for user ${userId}, plan ${plan}`);

        // Récupérer les détails de l'abonnement
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Mettre à jour l'utilisateur
        await db.query(`
          UPDATE type::thing("user", $userId) SET 
            profile_type = $profileType,
            stripe_customer_id = $customerId
        `, { 
          userId: userId.includes(':') ? userId.split(':')[1] : userId,
          profileType: plan === 'tutor' ? 'tuteur' : 'etablissement',
          customerId
        });

        // Créer ou mettre à jour l'abonnement
        await db.query(`
          DELETE FROM user_subscription WHERE user = type::thing("user", $userId);
          CREATE user_subscription SET
            user = type::thing("user", $userId),
            plan = type::thing("subscription_plan", $plan),
            stripe_subscription_id = $subscriptionId,
            stripe_customer_id = $customerId,
            status = $status,
            current_period_start = $periodStart,
            current_period_end = $periodEnd,
            created_at = time::now()
        `, {
          userId: userId.includes(':') ? userId.split(':')[1] : userId,
          plan: plan,
          subscriptionId,
          customerId,
          status: (subscription as any).status,
          periodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
          periodEnd: new Date((subscription as any).current_period_end * 1000).toISOString()
        });

        console.log(`[Webhook] ✅ Subscription created for user ${userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const plan = subscription.metadata?.plan;
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          console.log('[Webhook] No user_id in subscription metadata, skipping');
          break;
        }

        // Mettre à jour l'abonnement
        await db.query(`
          UPDATE user_subscription SET
            status = $status,
            current_period_start = $periodStart,
            current_period_end = $periodEnd,
            cancel_at_period_end = $cancelAtPeriodEnd
          WHERE stripe_subscription_id = $subscriptionId
        `, {
          subscriptionId: subscription.id,
          status: (subscription as any).status,
          periodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
          periodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: (subscription as any).cancel_at_period_end
        });

        console.log(`[Webhook] ✅ Subscription updated: ${subscription.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          console.log('[Webhook] No user_id in subscription metadata, skipping');
          break;
        }

        // Mettre à jour le statut
        await db.query(`
          UPDATE user_subscription SET
            status = 'canceled',
            canceled_at = time::now()
          WHERE stripe_subscription_id = $subscriptionId
        `, { subscriptionId: subscription.id });

        // Rétrograder l'utilisateur en apprenant
        await db.query(`
          UPDATE type::thing("user", $userId) SET 
            profile_type = 'apprenant'
        `, { 
          userId: userId.includes(':') ? userId.split(':')[1] : userId
        });

        console.log(`[Webhook] ✅ Subscription canceled: ${subscription.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          await db.query(`
            UPDATE user_subscription SET
              status = 'past_due'
            WHERE stripe_subscription_id = $subscriptionId
          `, { subscriptionId });

          console.log(`[Webhook] ⚠️ Payment failed for subscription: ${subscriptionId}`);
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return json({ received: true });

  } catch (error) {
    console.error('[Webhook] Error processing event:', error);
    return json({ error: 'Webhook handler failed' }, { status: 500 });
  }
};
