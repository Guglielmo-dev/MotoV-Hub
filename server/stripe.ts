import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing from environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia' as any, // Latest stable or specified
});

export const createCheckoutSession = async (userId: number, userEmail: string) => {
  return await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'MotoVault AI Quick Add Credit',
            description: '1 credit to scan a motorcycle registration document and add it instantly to your garage.',
          },
          unit_amount: 100, // 1.00 EUR
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.APP_URL || 'http://localhost:5173'}/garage?payment=success`,
    cancel_url: `${process.env.APP_URL || 'http://localhost:5173'}/garage?payment=cancel`,
    customer_email: userEmail,
    metadata: {
      userId: userId.toString(),
      type: 'ai_scan_credit',
    },
  });
};
