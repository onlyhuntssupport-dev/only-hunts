'use server';

import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getStorage } from 'firebase-admin/storage';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function createOutfitter(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return { error: 'Unauthorized' };
    }

    // Securely verify that the person making this request is an Admin
    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    if (decodedToken.admin !== true && decodedToken.role !== 'ADMIN') {
      return { error: 'Unauthorized: Admin access required' };
    }

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const owner = formData.get('owner') as string;
    const permitFile = formData.get('permit') as File;

    if (!email || !password || !name || !owner) {
      return { error: 'All text fields are required.' };
    }

    // Server-side enforcement of the permit file
    if (!permitFile || permitFile.size === 0) {
      return { error: 'Outfitter Permit document is strictly required for verification.' };
    }

    // 1. Create the user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    const uid = userRecord.uid;

    // 2. Set the Custom Claim for Role-Based Access Control
    await adminAuth.setCustomUserClaims(uid, { role: 'OUTFITTER' });

    // 3. Securely Upload the Permit to Firebase Storage
    // We create a buffer from the file and upload it to a private folder
    const buffer = Buffer.from(await permitFile.arrayBuffer());
    const fileExtension = permitFile.name.split('.').pop();
    const storagePath = `secure_permits/${uid}_permit.${fileExtension}`;
    
    // Get the default bucket configured in your Firebase Admin setup
    const bucket = getStorage().bucket();
    const file = bucket.file(storagePath);
    
    await file.save(buffer, { 
      contentType: permitFile.type,
      metadata: {
        metadata: {
          uploadedByAdmin: decodedToken.uid,
          ownerId: uid
        }
      }
    });

    // 4. Create the outfitter's database profile using the secure internal path
    await adminDb.collection('users').doc(uid).set({
      email,
      name,
      owner,
      role: 'OUTFITTER',
      status: 'PENDING',
      permitPath: storagePath, // Admin-only path, not a public URL
      dateApplied: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    });

    // 5. Force Next.js to refresh the table UI
    revalidatePath('/dashboard/outfitters');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error creating outfitter:', error);
    
    // Check if the error is related to a missing Storage Bucket configuration
    if (error.message && error.message.includes('bucket')) {
      return { error: 'Firebase Storage bucket is not configured in your admin environment.' };
    }
    
    return { error: error.message || 'Failed to create outfitter' };
  }
}