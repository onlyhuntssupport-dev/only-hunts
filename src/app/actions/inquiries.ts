'use server';

import { adminDb } from '@/lib/firebase/admin';
import { firestore } from 'firebase-admin';
import { revalidatePath } from 'next/cache';

export async function submitInquiry(formData: any) {
  try {
    // 1. Add to Firestore 'inquiries' collection
    const docRef = await adminDb.collection('inquiries').add({
      ...formData,
      createdAt: new Date().toISOString(),
      status: 'new'
    });

    // 2. Increment a 'leadCount' on the Hunt document for analytics
    await adminDb.collection('hunts').doc(formData.huntId).update({
      leadCount: firestore.FieldValue.increment(1)
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Inquiry Error:", error);
    return { success: false, error: "Could not send inquiry." };
  }
}

export async function updateInquiryStatus(inquiryId: string, newStatus: 'new' | 'responded' | 'booked' | 'archived') {
  try {
    await adminDb.collection('inquiries').doc(inquiryId).update({
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    
    revalidatePath('/outfitter/dashboard/leads');
    revalidatePath('/outfitter/dashboard');
    return { success: true };
  } catch (error) {
    console.error("Failed to update status:", error);
    return { success: false, error: "Update failed" };
  }
}
