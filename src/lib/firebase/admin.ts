
import * as admin from 'firebase-admin';

/**
 * Normalizes a PEM key to ensure it is byte-perfect for the Node.js crypto library.
 */
const cleanPEM = (key: string | undefined): string | undefined => {
  if (!key) return undefined;

  let cleaned = key.trim();

  // 1. Remove wrapping quotes (common in env vars)
  cleaned = cleaned.replace(/^['"]|['"]$/g, '');

  // 2. Handle escaped newlines (both \n and \\n)
  cleaned = cleaned.replace(/\\n/g, '\n');

  // 3. Remove accidental Unicode non-breaking spaces
  cleaned = cleaned.replace(/\u00a0/g, ' ');

  // 4. Ensure the BEGIN/END headers are present and correctly formatted
  const header = "-----BEGIN PRIVATE KEY-----";
  const footer = "-----END PRIVATE KEY-----";

  if (!cleaned.includes(header)) {
    // If the headers are missing, the key is likely just the raw base64 block
    cleaned = `${header}\n${cleaned}\n${footer}`;
  }

  return cleaned;
};

const getAdminApp = () => {
  // Check if already initialized to handle Next.js Hot Module Replacement
  if (admin.apps.length > 0) return admin.apps[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  
  // Try both raw and B64 versions
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  const b64Key = process.env.FIREBASE_PRIVATE_KEY_B64;

  let privateKey: string | undefined;

  if (b64Key) {
    // If using B64, decode first
    const decoded = Buffer.from(b64Key, 'base64').toString('utf8');
    privateKey = cleanPEM(decoded);
  } else {
    privateKey = cleanPEM(rawKey);
  }

  if (!projectId || !clientEmail || !privateKey) {
    console.error("ADMIN_INIT_FAILURE: Missing components", { 
      projectId: !!projectId, 
      clientEmail: !!clientEmail, 
      privateKey: !!privateKey 
    });
    throw new Error("Firebase Admin Credentials incomplete.");
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error: any) {
    // If we STILL get an invalid PEM here, the key string itself is corrupted
    console.error("PEM_PARSING_ERROR: The key format is still rejected by Node.js crypto.");
    throw error;
  }
};

const app = getAdminApp();
export const adminAuth = admin.auth(app);
export const adminDb = admin.firestore(app);
