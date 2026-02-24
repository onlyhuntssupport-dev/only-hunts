import * as admin from 'firebase-admin';

const getAdminApp = () => {
  if (admin.apps.length > 0) return admin.apps[0];

  // Map of potential variable names to check
  const config = {
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Check for both raw PEM and Base64 versions
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    privateKeyB64: process.env.FIREBASE_PRIVATE_KEY_B64,
  };

  let finalKey: string | undefined;

  // 1. Handle Base64 if it exists
  if (config.privateKeyB64) {
    finalKey = Buffer.from(config.privateKeyB64, 'base64')
      .toString('utf8')
      .replace(/\\n/g, '\n');
  } 
  // 2. Handle raw PEM if Base64 is missing
  else if (config.privateKey) {
    finalKey = config.privateKey.replace(/\\n/g, '\n');
  }

  if (config.projectId && config.clientEmail && finalKey) {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: finalKey,
      }),
    });
  }

  // Debug log to terminal to see what IS and IS NOT there
  console.error("Firebase Admin Config State:", {
    hasProjectId: !!config.projectId,
    hasEmail: !!config.clientEmail,
    hasRawKey: !!config.privateKey,
    hasB64Key: !!config.privateKeyB64
  });

  throw new Error("CRITICAL: Firebase Admin credentials not found in process.env");
};

const app = getAdminApp();
export const adminAuth = admin.auth(app);
export const adminDb = admin.firestore(app);