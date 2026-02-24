import admin from 'firebase-admin';

// 1. Validation helper to ensure env vars are loaded
const getEnvVar = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing Environment Variable: ${name}`);
  }
  return value;
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: getEnvVar('FIREBASE_PROJECT_ID'),
        clientEmail: getEnvVar('FIREBASE_CLIENT_EMAIL'),
        // Handle both actual newlines and escaped string newlines
        privateKey: getEnvVar('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
      }),
    });
    console.log("Firebase Admin Initialized Successfully");
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
