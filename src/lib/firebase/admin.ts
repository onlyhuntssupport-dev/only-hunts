import * as admin from 'firebase-admin';

const getAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    // This will now throw a clear error in your terminal 
    // instead of letting the app crash silently.
    throw new Error(
      "Firebase Admin Credentials missing. Check FIREBASE_PROJECT_ID, CLIENT_EMAIL, and PRIVATE_KEY in your environment variables."
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
};

// Initialize the app
const app = getAdminApp();

// Export services tied to the initialized app
export const adminAuth = admin.auth(app);
export const adminDb = admin.firestore(app);
