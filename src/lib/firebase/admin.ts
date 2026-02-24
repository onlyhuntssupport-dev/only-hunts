
import * as admin from 'firebase-admin';

const getAdminApp = () => {
  if (admin.apps.length > 0) return admin.apps[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let rawKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawKey) {
    throw new Error("Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY");
  }

  let privateKey: string;

  try {
    // 1. The Native JSON Bypass
    // By wrapping the raw environment string in quotes and parsing it as JSON, 
    // the V8 engine natively and perfectly converts \\n to actual line breaks.
    if (!rawKey.startsWith('"')) {
      rawKey = `"${rawKey}"`;
    }
    privateKey = JSON.parse(rawKey);
  } catch (parseError) {
    // 2. Fallback if it's already properly formatted
    privateKey = rawKey.replace(/\\n/g, '\n');
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    // 3. The Ultimate Debugger: 
    // If it still fails, this will log the first and last 30 characters of the key 
    // so you can physically see if your Studio environment truncated it.
    console.error("FATAL PEM ERROR. Key starts with:", privateKey.substring(0, 30));
    console.error("Key ends with:", privateKey.substring(privateKey.length - 30));
    throw error;
  }
};

const app = getAdminApp();
export const adminAuth = app.auth();
export const adminDb = app.firestore();
