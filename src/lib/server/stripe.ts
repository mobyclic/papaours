/**
 * Configuration Stripe côté serveur
 */
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY non définie - les paiements ne fonctionneront pas');
}

export const stripe = new Stripe(STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-01-28.clover'
});

// Montants de dons prédéfinis (en centimes)
export const DONATION_AMOUNTS = [
  { amount: 300, label: '3 €', emoji: '☕', description: 'Un café' },
  { amount: 500, label: '5 €', emoji: '🍕', description: 'Une pizza' },
  { amount: 1000, label: '10 €', emoji: '📚', description: 'Un livre' },
  { amount: 2000, label: '20 €', emoji: '🎁', description: 'Un cadeau' },
  { amount: 5000, label: '50 €', emoji: '🚀', description: 'Super soutien' }
];

export interface CreateCheckoutSessionParams {
  amount: number; // en centimes
  donorEmail?: string;
  donorName?: string;
  message?: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Créer une session de paiement Stripe Checkout
 */
export async function createDonationCheckoutSession({
  amount,
  donorEmail,
  donorName,
  message,
  successUrl,
  cancelUrl
}: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  const metadata: Record<string, string> = {
    type: 'donation'
  };
  
  if (donorName) metadata.donor_name = donorName;
  if (message) metadata.message = message;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Don pour Kweez',
            description: message || 'Merci pour votre soutien !',
            images: ['https://papaours.app/logo.png'] // À remplacer par le vrai logo
          },
          unit_amount: amount
        },
        quantity: 1
      }
    ],
    customer_email: donorEmail,
    metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
    // Options de personnalisation
    billing_address_collection: 'auto',
    submit_type: 'donate'
  });

  return session;
}

/**
 * Vérifier une session de paiement
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId);
}

// ============================================
// ABONNEMENTS
// ============================================

// Plans avec leurs caractéristiques
export const PLANS = {
  free: {
    name: 'Apprenant',
    slug: 'free',
    price_monthly: 0,
    max_students: 0,
    max_tutors: 0,
    features: ['Quiz illimités', 'Progression personnelle', 'Badges']
  },
  tutor: {
    name: 'Tuteur',
    slug: 'tutor',
    price_monthly: 500, // en centimes
    max_students: 5,
    max_tutors: 0,
    features: ['Tout le plan gratuit', 'Créer 5 apprenants', 'Quiz personnalisés', 'Suivi des apprenants']
  },
  establishment: {
    name: 'Établissement',
    slug: 'establishment',
    price_monthly: 2000, // en centimes
    max_students: -1, // illimité
    max_tutors: 5,
    features: ['Tout le plan Tuteur', '5 tuteurs inclus', 'Classes illimitées', 'Examens en ligne', '+5€/tuteur supplémentaire']
  }
} as const;

export type PlanSlug = keyof typeof PLANS;

export interface CreateSubscriptionCheckoutParams {
  plan: 'tutor' | 'establishment';
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Créer une session Checkout pour un abonnement
 */
export async function createSubscriptionCheckoutSession({
  plan,
  userId,
  userEmail,
  successUrl,
  cancelUrl
}: CreateSubscriptionCheckoutParams): Promise<Stripe.Checkout.Session> {
  // Récupérer ou créer le prix pour ce plan
  const priceId = await getOrCreatePriceForPlan(plan);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    customer_email: userEmail,
    metadata: {
      type: 'subscription',
      plan: plan,
      user_id: userId
    },
    subscription_data: {
      metadata: {
        plan: plan,
        user_id: userId
      }
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true
  });

  return session;
}

/**
 * Récupérer ou créer le prix Stripe pour un plan
 */
async function getOrCreatePriceForPlan(plan: 'tutor' | 'establishment'): Promise<string> {
  const planConfig = PLANS[plan];
  
  // Chercher un produit existant
  const products = await stripe.products.list({ active: true, limit: 100 });
  let product = products.data.find(p => p.metadata.kweez_plan === plan);
  
  if (!product) {
    // Créer le produit
    product = await stripe.products.create({
      name: `Kweez ${planConfig.name}`,
      description: planConfig.features.join(' • '),
      metadata: { kweez_plan: plan }
    });
  }

  // Chercher un prix mensuel existant
  const prices = await stripe.prices.list({ product: product.id, active: true });
  let price = prices.data.find(p => p.recurring?.interval === 'month');
  
  if (!price) {
    // Créer le prix mensuel
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: planConfig.price_monthly,
      currency: 'eur',
      recurring: { interval: 'month' },
      metadata: { kweez_plan: plan, interval: 'monthly' }
    });
  }

  return price.id;
}

/**
 * Créer une session du portail client Stripe
 * Permet de gérer l'abonnement, changer de carte, annuler, etc.
 */
export async function createBillingPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  });
}

/**
 * Récupérer l'abonnement actif d'un client
 */
export async function getActiveSubscription(customerId: string): Promise<Stripe.Subscription | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1
  });
  
  return subscriptions.data[0] || null;
}

/**
 * Annuler un abonnement à la fin de la période
 */
export async function cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true
  });
}
