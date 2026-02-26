
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// 1. The Key Fix: Handle newlines correctly for Cloud Environments
const privateKey = process.env.FIREBASE_PRIVATE_KEY 
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
  : undefined;

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: privateKey,
};

// 2. Singleton Pattern for Admin App
export function getAdminApp(): App {
  if (getApps().length === 0) {
    return initializeApp({
      credential: cert(serviceAccount),
    });
  }
  return getApps()[0];
}

// 3. FIX: Ensure these are exported so your 'actions/admin.ts' can find them
export const adminAuth = getAuth(getAdminApp());
export const adminDb = getFirestore(getAdminApp());
