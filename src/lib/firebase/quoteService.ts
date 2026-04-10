import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client'; // <-- Fixed Import Path

/**
 * Locks in a Hunter's acceptance of a custom quote.
 * Updates the status and records the legally binding signature.
 */
export async function acceptCustomQuote(
  quoteId: string,
  hunterSignature: string,
  outfitterEmail?: string // Passed in to trigger the notification
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!quoteId) throw new Error("Quote ID is required.");
    if (!hunterSignature || hunterSignature.length < 3) {
      throw new Error("A valid digital signature is required to bind this agreement.");
    }

    // 1. Point to the specific quote in the database
    const quoteRef = doc(db, 'quotes', quoteId);

    // 2. Update the document with the immutable acceptance data
    await updateDoc(quoteRef, {
      status: 'ACCEPTED',
      hunterAcceptance: {
        signatureName: hunterSignature,
        acceptedAt: serverTimestamp(),
        woundedGamePolicyAccepted: true, // Hardcoded audit trail
      }
    });

    // 3. Automated Email Notification (Using Firebase "Trigger Email" Extension)
    if (outfitterEmail) {
      const mailRef = collection(db, 'mail');
      await addDoc(mailRef, {
        to: outfitterEmail,
        message: {
          subject: `🎉 Safari Booked! Quote Accepted by ${hunterSignature}`,
          html: `
            <h2>Great news!</h2>
            <p><strong>${hunterSignature}</strong> has officially accepted your custom quote and agreed to the Wounded Game policy.</p>
            <p>Log in to your Only-Hunts dashboard to view the final itinerary and contact the hunter to arrange deposits.</p>
          `
        }
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error securing quote acceptance:", error);
    return { success: false, error: error.message || "Failed to lock in the booking." };
  }
}

/**
 * Declines a quote, freeing up the Outfitter's calendar.
 */
export async function declineCustomQuote(quoteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const quoteRef = doc(db, 'quotes', quoteId);
    
    await updateDoc(quoteRef, {
      status: 'DECLINED',
      declinedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error declining quote:", error);
    return { success: false, error: error.message || "Failed to decline the quote." };
  }
}