import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

const stripe = new Stripe(env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia'
});

export const POST: RequestHandler = async ({ request, url }) => {
  try {
    const { amount, donorName, message } = await request.json();

    // Validation
    if (!amount || amount < 1) {
      return json({ error: 'Montant invalide (minimum 1€)' }, { status: 400 });
    }

    if (amount > 500) {
      return json({ error: 'Montant maximum: 500€' }, { status: 400 });
    }

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Don pour Papa Ours',
              description: message 
                ? `Message de ${donorName || 'Anonyme'}: "${message}"`
                : `Don de ${donorName || 'Anonyme'}`,
              images: ['https://papaours.app/images/logo.png'], // À remplacer par ton logo
            },
            unit_amount: Math.round(amount * 100), // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${url.origin}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url.origin}/donate?cancelled=true`,
      metadata: {
        donor_name: donorName || 'Anonyme',
        message: message || '',
        amount: amount.toString()
      },
      // Permettre au donateur d'ajuster la quantité
      allow_promotion_codes: true,
    });

    return json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Stripe error:', error);
    return json({ 
      error: error instanceof Error ? error.message : 'Erreur lors de la création du paiement' 
    }, { status: 500 });
  }
};
