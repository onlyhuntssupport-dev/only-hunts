import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client'; // <-- Fixed Import Path
import { PricingMatrix } from '@/types/only-quotes';

/**
 * Saves or updates the Outfitter's Pricing Matrix securely in the database.
 */
export async function savePricingMatrix(
  outfitterId: string,
  data: Partial<PricingMatrix>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!outfitterId) throw new Error("Outfitter ID is required to secure this document.");

    // Point to the specific configuration document in the database
    // Path: outfitters/{outfitterId}/documents/pricing_matrix
    const matrixRef = doc(db, 'outfitters', outfitterId, 'documents', 'pricing_matrix');

    // Attach a server-side timestamp to protect against local clock manipulation
    const payload = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // setDoc with { merge: true } safely updates only the fields that changed
    await setDoc(matrixRef, payload, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error("Error securing Pricing Matrix:", error);
    return { success: false, error: error.message || "Failed to securely lock pricing data." };
  }
}