'use server';

import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Allows a Super Admin to add staff members.
 * Checks if the person performing the action is already an ADMIN.
 */
export async function assignStaffRole(targetUid: string, requestingAdminUid: string) {
  const requester = await adminAuth.getUser(requestingAdminUid);
  
  if (requester.customClaims?.role !== 'ADMIN') {
    throw new Error("Unauthorized: Only admins can assign staff roles.");
  }

  await adminAuth.setCustomUserClaims(targetUid, { role: 'ADMIN' });
  await adminDb.collection('users').doc(targetUid).update({ role: 'ADMIN' });
  
  revalidatePath('/admin/staff');
  return { success: true };
}

/**
 * Outfitter Verification Gatekeeper
 */
export async function verifyOutfitter(outfitterUid: string) {
  try {
    // 1. Update Firestore Profile
    await adminDb.collection('users').doc(outfitterUid).update({
      isVerified: true,
      verifiedAt: new Date().toISOString(),
    });

    // 2. Update all Hunts owned by this outfitter to 'Verified' status
    const huntsSnapshot = await adminDb.collection('hunts')
      .where('outfitterId', '==', outfitterUid)
      .get();

    const batch = adminDb.batch();
    huntsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isVerified: true });
    });
    
    await batch.commit();
    revalidatePath('/hunts');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Verification failed." };
  }
}
