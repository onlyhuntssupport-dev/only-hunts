'use server';

import { adminDb } from '@/lib/firebase/admin';
import { Resend } from 'resend';
import OfferNotificationEmail from '@/emails/OfferNotificationEmail';

// Initialize Resend safely with a dummy key so it doesn't crash the app during development
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_123');

export async function sendBlindOffers(outfitterId: string, huntId: string, huntTitle: string, message: string) {
  try {
    // 1. Fetch Outfitter Name for the email
    let outfitterName = "An Outfitter";
    const outfitterDoc = await adminDb.collection('users').doc(outfitterId).get();
    if (outfitterDoc.exists) {
      const data = outfitterDoc.data();
      outfitterName = data?.companyName || data?.name || "An Outfitter";
    }

    // 2. Find every single hunter who has this specific hunt saved
    const wishlistsSnap = await adminDb.collection('wishlists')
      .where('huntIds', 'array-contains', huntId)
      .get();

    if (wishlistsSnap.empty) {
      return { success: false, error: "No hunters have this package saved currently." };
    }

    // 3. Prepare the batch for database and an array for email promises
    const batch = adminDb.batch();
    const emailPromises: Promise<any>[] = [];

    // Base URL for the email button (Use localhost in dev, or your real domain in prod)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9003';
    const dashboardLink = `${baseUrl}/hunter/dashboard`;

    for (const docSnap of wishlistsSnap.docs) {
      const hunterId = docSnap.id;
      
      // A. Create a new exclusive offer document for this specific hunter
      const offerRef = adminDb.collection('offers').doc();
      batch.set(offerRef, {
        outfitterId,
        hunterId,
        huntId,
        huntTitle,
        message,
        status: 'UNREAD',
        createdAt: new Date().toISOString()
      });

      // B. Fetch the Hunter's real email address and name
      const hunterDoc = await adminDb.collection('users').doc(hunterId).get();
      if (hunterDoc.exists) {
        const hunterData = hunterDoc.data();
        const hunterEmail = hunterData?.email;
        const hunterName = hunterData?.name || "Hunter";

        // C. Queue the Email ONLY if a real API key exists
        const apiKey = process.env.RESEND_API_KEY;
        if (hunterEmail && apiKey && apiKey !== 're_dummy_key_123') {
          emailPromises.push(
            resend.emails.send({
              from: 'Only-Hunts <notifications@only-hunts.com>',
              to: hunterEmail,
              subject: `VIP Offer: ${outfitterName} sent you a deal!`,
              react: (
                <OfferNotificationEmail
                  hunterName={hunterName}
                  outfitterName={outfitterName}
                  huntTitle={huntTitle}
                  message={message}
                  dashboardLink={dashboardLink}
                />
              ),
            })
          );
        }
      }
    }

    // 4. Fire the database batch and send all emails simultaneously!
    await Promise.all([
      batch.commit(),
      ...emailPromises
    ]);

    return { success: true, count: wishlistsSnap.size };

  } catch (error: any) {
    console.error("Error sending offers and emails:", error);
    return { success: false, error: "Failed to send offers. Please try again." };
  }
}