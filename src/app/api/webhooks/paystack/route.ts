// Module 30: Paystack Webhook to Firebase Firestore
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
// Note: Ensure your Firebase Admin SDK is initialized in your project before calling getFirestore()

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex');

    const signature = req.headers.get('x-paystack-signature');

    if (hash !== signature) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const db = getFirestore();

    // Handle successful subscription charge
    if (event.event === 'charge.success') {
      const { metadata, customer } = event.data;
      
      if (metadata?.outfitterId) {
        const outfitterRef = db.collection('outfitters').doc(metadata.outfitterId);
        
        // Calculate 30 days from now for the subscription cycle
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);

        // Update the Firestore document with the required fields
        await outfitterRef.update({
          tier: 'pro_tier',
          paystackCustomerCode: customer.customer_code,
          subscriptionEndsAt: Timestamp.fromDate(expirationDate),
          isAdminOverride: false
        });
        
        console.log(`Updated outfitter ${metadata.outfitterId} to Pro Tier in Firestore`);
      }
    }

    // Handle subscription cancellation
    if (event.event === 'subscription.disable') {
       const { customer } = event.data;
       // Query Firestore for the outfitter using the customer code and revert tier
       const snapshot = await db.collection('outfitters').where('paystackCustomerCode', '==', customer.customer_code).get();
       if (!snapshot.empty) {
         const doc = snapshot.docs[0];
         await doc.ref.update({ tier: 'suspended' });
       }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}