import * as admin from 'firebase-admin';

const getAdminApp = () => {
  if (admin.apps.length > 0) return admin.apps[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const b64Key = process.env.FIREBASE_PRIVATE_KEY_B64;

  if (projectId && clientEmail && b64Key) {
    // Decode Base64 back to the raw PEM string
    const privateKey = Buffer.from(b64Key, 'base64')
      .toString('utf8')
      .replace(/\\n/g, '\n'); // Safety catch for literal \n

    return admin.initializeApp({
      credential: admin.credential.cert({ 
        projectId, 
        clientEmail, 
        privateKey 
      }),
    });
  }

  throw new Error("Missing FIREBASE_PRIVATE_KEY_B64 or other credentials.");
};

const app = getAdminApp();
export const adminAuth = admin.auth(app);
export const adminDb = admin.firestore(app);
