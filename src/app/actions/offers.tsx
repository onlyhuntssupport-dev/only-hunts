'use server';

import { adminDb } from '@/lib/firebase/admin';
import { sendPlatformEmail } from '@/lib/email/sender'; // NEW CENTRAL UTILITY
import OfferNotificationEmail from '@/emails/OfferNotificationEmail';

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

    // Base URL for the email button
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9003';
    const dashboardLink = `${baseUrl}/hunter/dashboard`;

    for (const docSnap of wishlistsSnap.docs) {
      const hunterId = docSnap.id;
      
      // A. Create a new exclusive offer document
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

        // C. Queue the Email via Central Utility
        if (hunterEmail) {
          emailPromises.push(
            sendPlatformEmail({
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