import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing from environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia' as any, // Latest stable or specified
});

import { StripeProductType } from '@shared/schema';

export const createCheckoutSession = async (userId: number, userEmail: string, type: StripeProductType) => {
  const products: Record<StripeProductType, { name: string, description: string, amount: number }> = {
    ai_scan_credit: {
      name: 'MotoVault AI Quick Add Credit',
      description: '1 credit to scan a motorcycle registration document and add it instantly to your garage.',
      amount: 100, // 1.00 EUR
    },
    motorcycle_slot: {
      name: 'MotoVault Garage Slot',
      description: 'Expand your garage with 1 additional motorcycle slot.',
      amount: 100, // 1.00 EUR
    }
  };

  const product = products[type];

  return await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.amount,
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
      type: type,
    },
  });
};
