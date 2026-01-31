/**
 * API pour créer une session de don Stripe
 */
import { json, type RequestEvent } from '@sveltejs/kit';
import { createDonationCheckoutSession, DONATION_AMOUNTS } from '$lib/server/stripe';

export const POST = async ({ request, url }: RequestEvent) => {
  try {
    const body = await request.json();
    const { amount, email, name, message, customAmount } = body;

    // Validation du montant
    let donationAmount: number;
    
    if (customAmount && typeof customAmount === 'number' && customAmount >= 100) {
      // Montant personnalisé (minimum 1€ = 100 centimes)
      donationAmount = Math.round(customAmount);
    } else if (amount && DONATION_AMOUNTS.some(d => d.amount === amount)) {
      // Montant prédéfini
      donationAmount = amount;
    } else {
      return json({ error: 'Montant invalide' }, { status: 400 });
    }

    // Limiter à 10000€ max
    if (donationAmount > 1000000) {
      return json({ error: 'Montant trop élevé (max 10000€)' }, { status: 400 });
    }

    const baseUrl = url.origin;
    
    const session = await createDonationCheckoutSession({
      amount: donationAmount,
      donorEmail: email,
      donorName: name,
      message,
      successUrl: `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/donate?cancelled=true`
    });

    return json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Erreur création session Stripe:', error);
    return json(
      { error: 'Erreur lors de la création du paiement' }, 
      { status: 500 }
    );
  }
};
