'use server';

import { adminDb } from '@/lib/firebase/admin';
import { firestore } from 'firebase-admin';
import { revalidatePath } from 'next/cache';
import { sendInquiryEmail } from '@/lib/email/send';
import type { Inquiry } from '@/lib/validations/inquiry';

// A leaner type for server-side use, based on docs/backend.json
interface OutfitterProfile {
    displayName: string;
    email: string;
    // Add other fields if needed for emails
}

export async function submitInquiry(formData: Omit<Inquiry, 'id' | 'createdAt' | 'status'>) {
  try {
    const inquiryData: Inquiry = {
        ...formData,
        createdAt: new Date().toISOString(),
        status: 'new'
    }

    // 1. Add to Firestore 'inquiries' collection
    const docRef = await adminDb.collection('inquiries').add(inquiryData);

    // 2. Increment a 'leadCount' on the Hunt document for analytics
    await adminDb.collection('hunts').doc(formData.huntId).update({
      leadCount: firestore.FieldValue.increment(1)
    });

    // 3. Fetch Outfitter's profile to get their email for notification
    const outfitterDoc = await adminDb.collection('users').doc(formData.outfitterId).get();
    if (outfitterDoc.exists) {
        const outfitter = outfitterDoc.data() as OutfitterProfile;
        
        // 4. Send Email Notification (no need to await this)
        sendInquiryEmail({
          outfitter: outfitter,
          inquiry: inquiryData
        });
    } else {
        console.warn(`Outfitter profile not found for ID: ${formData.outfitterId}. Cannot send email notification.`);
    }

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
