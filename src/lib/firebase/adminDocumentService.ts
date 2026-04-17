import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './client'; // Corrected from './config' to './client'
import { DocumentStatus } from '@/types/documents'; 

/**
 * Admin function to approve or reject an Outfitter's uploaded document.
 */
export async function reviewDocument(
  documentId: string,
  outfitterId: string,
  newStatus: DocumentStatus,
  adminId: string,
  rejectionReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!documentId || !outfitterId) throw new Error("Missing required IDs.");

    // 1. Update the Document Record
    const docRef = doc(db, 'outfitter_documents', documentId);
    await updateDoc(docRef, {
      status: newStatus,
      verifiedAt: serverTimestamp(),
      verifiedBy: adminId,
      rejectionReason: rejectionReason || null,
    });

    // 2. Update the Outfitter's Global Profile Status
    // If approved, we set them to VERIFIED. If rejected, we flag them as REQUIRES_ACTION.
    const outfitterRef = doc(db, 'outfitters', outfitterId);
    const globalStatus = newStatus === 'VERIFIED' ? 'VERIFIED' : 'REQUIRES_ACTION';
    
    await updateDoc(outfitterRef, {
      verificationStatus: globalStatus
    });

    return { success: true };
  } catch (error: any) {
    console.error("Admin review failed:", error);
    return { success: false, error: error.message || "Failed to update document status." };
  }
}