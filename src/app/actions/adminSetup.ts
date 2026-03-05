'use server';

import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';

export async function seedMasterAdmin() {
  const email = 'krismasontsi@yahoo.com';
  const password = 'KrisKaiHunterMarlien9774';
  const displayName = 'KrisMason';

  try {
    let user;
    try {
      // Check if user already exists
      user = await adminAuth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create user in Firebase Auth
        user = await adminAuth.createUser({
          email,
          password,
          displayName: displayName,
        });
      } else {
        throw error;
      }
    }

    // Set custom claims for Firebase Security Rules and App Logic
    await adminAuth.setCustomUserClaims(user.uid, { role: 'ADMIN' });

    // Add to Firestore users collection with the master admin role
    await adminDb.collection('users').doc(user.uid).set({
      email,
      displayName,
      role: 'ADMIN', // Consistent with app's role checking
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isVerified: true, // Admins are auto-verified
    }, { merge: true });
    
    revalidatePath('/admin');

    return { success: true, message: `Master Admin '${displayName}' seeded successfully with email '${email}'.` };
  } catch (error: any) {
    console.error('Error seeding admin:', error);
    return { success: false, error: error.message };
  }
}
