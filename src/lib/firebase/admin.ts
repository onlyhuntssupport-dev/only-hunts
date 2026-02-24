import * as admin from 'firebase-admin';

const formatPrivateKey = (key: string) => {
  if (!key) return undefined;
  
  // 1. Remove surrounding quotes if the environment UI added them
  let formattedKey = key.replace(/^['"]|['"]$/g, '');
  
  // 2. Replace literal '\n' strings with actual newline characters
  // This handles both \\n (double escaped) and \n (single escaped)
  formattedKey = formattedKey.replace(/\\n/g, '\n');
  
  return formattedKey;
};

const getAdminApp = () => {
  const app = admin.apps.find(a => a);
  if (app) return app;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && rawKey) {
    const privateKey = formatPrivateKey(rawKey);
    
    try {
      return admin.initializeApp({
        credential: admin.credential.cert({ 
          projectId, 
          clientEmail, 
          privateKey 
        }),
      });
    } catch (error) {
      console.error("Firebase Admin cert error:", error);
      throw error;
    }
  }

  // Fallback to service account JSON if individual variables are not set
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if(serviceAccountVar) {
    try {
      const serviceAccount = JSON.parse(serviceAccountVar);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (e) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY found but is not valid JSON.");
    }
  }


  throw new Error("Firebase Admin Credentials incomplete or missing.");
};

const app = getAdminApp();
export const adminAuth = admin.auth(app);
export const adminDb = admin.firestore(app);