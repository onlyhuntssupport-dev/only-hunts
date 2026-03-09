'use server';

import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import * as admin from 'firebase-admin';

export async function createOutfitter(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return { error: 'Unauthorized: No active session found.' };
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    const name = formData.get('name') as string;
    const owner = formData.get('owner') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const permitFile = formData.get('permit') as File;

    if (!name || !owner || !email || !password || !permitFile) {
      return { error: 'Missing required fields.' };
    }

    // Step 1: Attempt to create the Auth User
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: owner,
      });
    } catch (authError: any) {
      console.error('Auth Creation Error:', authError);
      return { error: authError.message || 'Failed to create auth user. Email may be in use.' };
    }

    // Step 2 & 3: Attempt Storage Upload and Database Write
    try {
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
      const bucket = admin.storage().bucket(bucketName);
      
      const buffer = Buffer.from(await permitFile.arrayBuffer());
      
      const safeFileName = permitFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const fileName = `permits/${userRecord.uid}_${safeFileName}`;
      const file = bucket.file(fileName);
      
      await file.save(buffer, {
        metadata: { contentType: permitFile.type },
      });

      const permitUrl = await file.getSignedUrl({
        action: 'read',
        expires: '01-01-2100', 
      });

      await adminDb.collection('users').doc(userRecord.uid).set({
        name,
        owner,
        email,
        role: 'OUTFITTER',
        status: 'PENDING',
        permitUrl: permitUrl[0],
        createdBy: decodedClaims.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true };
      
    } catch (processError: any) {
      // ROLLBACK: If Storage or Firestore fails, delete the orphaned Auth account
      console.error('Process Error. Rolling back user creation...', processError);
      
      try {
        await adminAuth.deleteUser(userRecord.uid);
        console.log(`Successfully rolled back (deleted) user: ${userRecord.uid}`);
      } catch (rollbackError) {
        console.error('CRITICAL: Failed to rollback user after process error:', rollbackError);
      }

      return { error: `System Error: ${processError.message || 'Failed to process outfitter data.'}` };
    }
    
  } catch (fatalError: any) {
    console.error('Server Action Fatal Crash:', fatalError);
    return { error: fatalError.message || 'An unexpected server error occurred.' };
  }
}