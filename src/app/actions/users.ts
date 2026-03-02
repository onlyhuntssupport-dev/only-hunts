
'use server';

import { adminDb } from '@/lib/firebase/admin';
import type { UserRole } from '@/types/auth';

interface SyncUserParams {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
}

export async function syncUserProfile({ uid, email, displayName, photoURL, role }: SyncUserParams) {
  try {
    const userRef = adminDb.collection('users').doc(uid);
    const docSnap = await userRef.get();

    if (!docSnap.exists) {
      // First-time login: Create the complete profile
      const newProfile = {
        displayName,
        email,
        photoURL,
        role, // Only set role on creation
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isVerified: role === 'HUNTER', // Hunters are auto-verified, Outfitters need admin approval
      };
      
      await userRef.set(newProfile);
      return { success: true, isNewUser: true, role };
    } else {
      // Returning user: Only update what's necessary
      const updatePayload = {
        updatedAt: new Date().toISOString(),
        photoURL, // Update in case their Google profile picture changed
      };
      await userRef.set(updatePayload, { merge: true });

      const existingData = docSnap.data();
      // Return their actual database role, ignoring any role sent from the client
      return { success: true, isNewUser: false, role: existingData?.role || 'HUNTER' };
    }
  } catch (error) {
    console.error('Error syncing user profile:', error);
    return { success: false, error: 'Failed to sync user profile' };
  }
}
