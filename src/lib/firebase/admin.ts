import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Debugging check to ensure env vars are actually loading
if (!process.env.FIREBASE_PROJECT_ID) {
  console.error('CRITICAL ERROR: FIREBASE_PROJECT_ID is missing. Check your .env.local file and restart the server.');
}

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Initialize the app only if it doesn't already exist
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(firebaseAdminConfig),
    });
    console.log('✅ Firebase Admin Initialized Successfully');
  } catch (error) {
    console.error('❌ Firebase Admin Initialization Error:', error);
  }
}

// Export the modular instances
export const adminDb = getFirestore();
export const adminAuth = getAuth();
