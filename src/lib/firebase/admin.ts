// Updated private key logic
const rawKey = process.env.FIREBASE_PRIVATE_KEY;

const formatPrivateKey = (key: string | undefined) => {
  if (!key) return undefined;
  // 1. Remove any accidental wrapping quotes
  let formatted = key.replace(/^['"]|['"]$/g, '');
  // 2. Handle escaped newlines
  formatted = formatted.replace(/\\n/g, '\n');
  // 3. If it's all on one line without newlines, the SDK will fail. 
  // This ensures the header and footer are on their own lines.
  if (!formatted.includes('\n') && formatted.includes('-----BEGIN PRIVATE KEY-----')) {
     formatted = formatted
       .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
       .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
  }
  return formatted;
};

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: formatPrivateKey(rawKey),
};