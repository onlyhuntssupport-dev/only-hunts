
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function forceCreateAdmin() {
    console.log("🚀 Starting Admin Creation Script...");

    // Check for necessary environment variables
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        console.error('❌ CRITICAL ERROR: Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY in your .env.local file.');
        console.error('Please ensure the .env.local file in the root directory is correctly configured.');
        process.exit(1);
    }
    
    try {
        // Initialize Admin SDK
        if (!getApps().length) {
            initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });
            console.log("🔥 Firebase Admin SDK Initialized.");
        }

        const adminDb = getFirestore();
        const adminAuth = getAuth();

        const email = 'krismasontsi@yahoo.com';
        const password = 'KrisKaiHunterMarlien9774';
        const displayName = 'KrisMason';

        let user;
        try {
            user = await adminAuth.getUserByEmail(email);
            console.log("✅ Auth account already exists. Updating Firestore and claims...");
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                user = await adminAuth.createUser({
                    email,
                    password,
                    displayName,
                });
                console.log("✅ Created new Auth user.");
            } else {
                throw error; // Re-throw other errors
            }
        }

        // Set custom claims for role-based access
        await adminAuth.setCustomUserClaims(user.uid, { role: 'ADMIN' });
        console.log("✅ Set custom claim: { role: 'ADMIN' }");

        // Add/update user profile in Firestore
        await adminDb.collection('users').doc(user.uid).set({
            email,
            displayName,
            role: 'ADMIN', // Align with custom claim
            isVerified: true, // Admins are auto-verified
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }, { merge: true });
        console.log("✅ Synced user profile to Firestore.");

        console.log("\n🎯 SUCCESS: KrisMason is now the Master Admin.");
        console.log("You can now log in at /login with the admin credentials.");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ SCRIPT FAILED:", error.message || error);
        process.exit(1);
    }
}

forceCreateAdmin();
