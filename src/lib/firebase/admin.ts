import * as admin from 'firebase-admin';

const getAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // 1. Try to get the individual variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // 2. Try to get the combined JSON string (The "Golden" Backup)
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (projectId && clientEmail && privateKey) {
    return admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }

  if (serviceAccountVar) {
    try {
      const serviceAccount = JSON.parse(serviceAccountVar);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (e) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY found but is not valid JSON.");
    }
  }

  throw new Error(
    "CRITICAL: All Firebase Admin Credential methods failed. Check your environment UI."
  );
};

const app = getAdminApp()!;
export const adminAuth = admin.auth(app);
export const adminDb = admin.firestore(app);
