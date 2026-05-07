import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

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

    if (event.event === 'charge.success') {
      const { metadata, customer } = event.data;
      
      // ====================================================================
      // FLOW A: OUTFITTER SUBSCRIPTION UPGRADE
      // ====================================================================
      if (metadata?.type === 'subscription' && metadata?.outfitterId) {
        const outfitterRef = db.collection('outfitters').doc(metadata.outfitterId);
        
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);

        await outfitterRef.update({
          tier: 'pro_tier',
          paystackCustomerCode: customer.customer_code,
          subscriptionEndsAt: Timestamp.fromDate(expirationDate),
          isAdminOverride: false
        });
        
        console.log(`Updated outfitter ${metadata.outfitterId} to Pro Tier`);
      }

      // ====================================================================
      // FLOW B: HUNTER DEPOSIT (PACKAGES & CUSTOM QUOTES)
      // ====================================================================
      if (metadata?.type === 'deposit') {
        const depositPaidUSD = (metadata.totalPriceUSD * metadata.depositPct) / 100;
        const balanceDueUSD = metadata.totalPriceUSD - depositPaidUSD;

        // Fetch Hunt Title to ensure it's saved on the receipt
        let huntTitle = metadata.huntTitle || 'Custom Safari Package';
        if (!metadata.huntTitle && metadata.huntId) {
           const huntDoc = await db.collection('hunts').doc(metadata.huntId).get();
           if (huntDoc.exists) huntTitle = huntDoc.data()?.title || huntTitle;
        }

        const bookingData = {
          hunterId: metadata.hunterId, // Must be passed in metadata from frontend
          outfitterId: metadata.outfitterId,
          huntId: metadata.huntId,
          huntTitle: huntTitle,
          totalPriceUSD: metadata.totalPriceUSD,
          depositPaidUSD: depositPaidUSD,
          balanceDueUSD: balanceDueUSD,
          status: 'DEPOSIT_SECURED',
          paystackReference: event.data.reference,
          createdAt: Timestamp.now(),
        };

        // Write the receipt to the bookings collection
        await db.collection('bookings').add(bookingData);
        console.log(`Successfully generated booking receipt for hunter ${metadata.hunterId}`);
      }

      // ====================================================================
      // FLOW C: BRAND AD SPONSORSHIPS
      // ====================================================================
      if (metadata?.type === 'ad_sponsor' && metadata?.campaignId) {
        const campaignRef = db.collection('sponsored_hunts').doc(metadata.campaignId);
        
        await campaignRef.update({
          status: 'active',
          paidAt: Timestamp.now(),
          paystackReference: event.data.reference
        });
        
        console.log(`Successfully activated ad campaign ${metadata.campaignId} for sponsor ${metadata.sponsorId}`);
      }
    }

    // Handle subscription cancellation
    if (event.event === 'subscription.disable') {
       const { customer } = event.data;
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