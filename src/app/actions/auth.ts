'use server';

import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function setUserRole(uid: string, role: 'HUNTER' | 'OUTFITTER') {
  try {
    // 1. Set the Custom Claim on the Firebase Auth User object
    await adminAuth.setCustomUserClaims(uid, { role });

    // 2. Sync the role to the Firestore UserProfile for querying
    await adminDb.collection('users').doc(uid).update({
      role: role,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath('/'); // Refresh server cache
    return { success: true };
  } catch (error) {
    console.error("Failed to set user role:", error);
    return { success: false, error: "Authorization failed" };
  }
}

export async function serverLogOut() {
  cookies().delete('session');
  redirect('/login');
}
