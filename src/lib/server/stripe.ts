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
            name: 'Don pour Kwizy',
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
