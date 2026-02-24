import * as admin from 'firebase-admin';

const formatPrivateKey = (key: string) => {
  if (!key) return undefined;
  
  // 1. Clean up any accidental wrapping quotes or whitespace
  let cleanedKey = key.trim().replace(/^['"]|['"]$/g, '');
  
  // 2. The "Nuclear" Replace: 
  // This handles \n, \\n, and actual line breaks all at once.
  // It also ensures the BEGIN/END tags don't have weird spacing.
  const formattedKey = cleanedKey
    .replace(/\\n/g, '\n')      // Convert literal \n to real newline
    .replace(/\\/g, '')         // Remove any stray backslashes left over
    .replace(/\n/g, '\n');      // Normalize existing newlines

  // 3. Final Check: Ensure it has the PEM headers/footers
  if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----')) {
    return `-----BEGIN PRIVATE KEY-----\n${formattedKey}\n-----END PRIVATE KEY-----`;
  }

  return formattedKey;
};

const getAdminApp = () => {
  if (admin.apps.length > 0) return admin.apps[0];

  // Try fetching individual variables first
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && rawKey) {
    const privateKey = formatPrivateKey(rawKey);
    
    return admin.initializeApp({
      credential: admin.credential.cert({ 
        projectId, 
        clientEmail, 
        privateKey 
      }),
    });
  }

  throw new Error("Credentials still missing or malformed in environment.");
};

const app = getAdminApp();
export const adminAuth = admin.auth(app);
export const adminDb = admin.firestore(app);
