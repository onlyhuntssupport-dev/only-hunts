'use server'

import { adminDb } from "@/lib/firebase/admin";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PRO_PLAN_CODE = process.env.PAYSTACK_PRO_PLAN_CODE; 

/**
 * MODULE 4.1: PRO TIER SUBSCRIPTION
 */
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
        amount: 79900, // R799.00 in cents
        plan: PRO_PLAN_CODE,
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/outfitter/dashboard?upgraded=true`,
        metadata: {
          outfitterId,
          type: 'subscription'
        }
      }),
    });

    const data = await response.json();
    if (!data.status) throw new Error(data.message);

    return { authorizationUrl: data.data.authorization_url };
  } catch (error) {
    console.error('Subscription Init Error:', error);
    throw new Error('Failed to initialize subscription');
  }
}

/**
 * MODULE 4.2: HUNTER DEPOSIT PAYMENT
 */
export async function initializeHuntBooking(
  email: string, 
  huntId: string, 
  outfitterId: string, 
  amountCentsZAR: number,
  totalPriceUSD: number,
  depositPct: number,
  hunterId: string,   
  huntTitle: string   
) {
  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amountCentsZAR), 
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/hunter/dashboard/bookings?success=true`,
        metadata: {
          huntId,
          outfitterId,
          hunterId,     
          huntTitle,    
          type: 'deposit',
          totalPriceUSD,
          depositPct,
          platformCommissionPct: 12 
        }
      }),
    });

    const data = await response.json();
    if (!data.status) throw new Error(data.message);

    return { authorizationUrl: data.data.authorization_url };
  } catch (error) {
    console.error('Booking Init Error:', error);
    throw new Error('Failed to initialize booking payment');
  }
}

/**
 * MODULE 4.3: BRAND SPONSOR PAYMENT
 */
export async function initializeAdPayment(
  email: string,
  sponsorId: string, 
  campaignId: string,
  amountCentsZAR: number
) {
  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amountCentsZAR),
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/sponsor/dashboard?success=true`,
        metadata: {
          type: 'ad_sponsor',
          sponsorId, 
          campaignId
        }
      }),
    });

    const data = await response.json();
    if (!data.status) throw new Error(data.message);

    return { authorizationUrl: data.data.authorization_url };
  } catch (error) {
    console.error('Ad Payment Init Error:', error);
    throw new Error('Failed to initialize ad sponsorship payment');
  }
}

/**
 * MODULE 4.4: CANCEL SUBSCRIPTION
 * Finds the outfitter's active subscription in Paystack and disables it.
 */
export async function cancelSubscription(email: string, outfitterId: string) {
  try {
    // 1. Fetch all subscriptions for this email from Paystack
    const getSubsRes = await fetch(`https://api.paystack.co/subscription?email=${email}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
    
    const subsData = await getSubsRes.json();
    if (!subsData.status) throw new Error("Failed to fetch subscriptions from gateway.");

    // 2. Find the active one
    const activeSub = subsData.data.find((sub: any) => sub.status === 'active');
    
    if (activeSub) {
      // 3. Tell Paystack to disable it
      const disableRes = await fetch('https://api.paystack.co/subscription/disable', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: activeSub.subscription_code,
          token: activeSub.email_token
        }),
      });

      const disableData = await disableRes.json();
      if (!disableData.status) throw new Error("Failed to disable in Paystack.");
    }

    // 4. Update Firestore to remove PRO status immediately
    await adminDb.collection("outfitters").doc(outfitterId).update({
      tier: "standard",
      subscriptionEndsAt: null
    });

    return { success: true };
  } catch (error) {
    console.error('Cancel Subscription Error:', error);
    return { success: false, error: "Failed to cancel subscription." };
  }
}