import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase/client'; // <-- Fixed Import Path (Includes 'storage')
import { OutfitterDocument } from '@/types/documents';

/**
 * Uploads a physical file to Firebase Storage and records its metadata in Firestore.
 */
export async function uploadOutfitterDocument(
  file: File,
  outfitterId: string,
  docType: OutfitterDocument['type'],
  expiryDate: Date | null = null
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    if (!file) throw new Error("No file provided.");
    if (file.size > 5 * 1024 * 1024) throw new Error("File exceeds 5MB limit.");

    // 1. Create a secure, predictable path in Firebase Storage
    // e.g., outfitters/outfitter_123/documents/1684321_permit.pdf
    const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const storagePath = `outfitters/${outfitterId}/documents/${safeFileName}`;
    const storageRef = ref(storage, storagePath);

    // 2. Upload the file to Storage
    const snapshot = await uploadBytes(storageRef, file);
    
    // 3. Get the permanent download URL
    const fileUrl = await getDownloadURL(snapshot.ref);

    // 4. Construct the Database Record (matching Module 9)
    const documentPayload: Omit<OutfitterDocument, 'id' | 'uploadedAt'> & { uploadedAt: any } = {
      outfitterId,
      type: docType,
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      status: 'PENDING',
      expiryDate,
      uploadedAt: serverTimestamp(),
    };

    // 5. Save the record to the central 'documents' collection in Firestore
    const docsRef = collection(db, 'outfitter_documents');
    const newDoc = await addDoc(docsRef, documentPayload);

    // 6. Optional: Update the outfitter's profile to flag that a review is pending
    const outfitterRef = doc(db, 'outfitters', outfitterId);
    await updateDoc(outfitterRef, { verificationStatus: 'PENDING_REVIEW' });

    return { success: true, documentId: newDoc.id };

  } catch (error: any) {
    console.error("Document upload failed:", error);
    return { success: false, error: error.message || "Failed to upload document." };
  }
}