'use server'

import { headers } from 'next/headers';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
// You will create this plan in your Paystack Dashboard (e.g., R799/month)
const PRO_PLAN_CODE = process.env.PAYSTACK_PRO_PLAN_CODE; 

export async function initializeSubscription(email: string, outfitterId: string) {
  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: 79900, // Paystack uses cents/kobo (799 * 100)
        plan: PRO_PLAN_CODE,
        // FIX: Pointed to the new Outfitter Billing Hub
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/outfitter/billing?success=true`,
        metadata: {
          outfitterId,
          tier: 'pro_tier'
        }
      }),
    });

    const data = await response.json();
    
    if (!data.status) {
      throw new Error(data.message);
    }

    return { authorizationUrl: data.data.authorization_url };
  } catch (error) {
    console.error('Paystack Init Error:', error);
    throw new Error('Failed to initialize payment');
  }
}