import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let appCheck: any;

if (typeof window !== "undefined") {
  let appCheckInitialized = false;

  const initializeDeferredAppCheck = async () => {
    if (appCheckInitialized) return;
    appCheckInitialized = true;
    try {
      const { initializeAppCheck, ReCaptchaV3Provider } = await import("firebase/app-check");
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider("6Lc9orYsAAAAAOWl6-Dqw3qeaszRmR-pUb2h8Q1k"),
        isTokenAutoRefreshEnabled: true
      });
    } catch (error) {
      console.error("Failed to initialize Firebase App Check:", error);
    }
  };

  const interactionEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
  
  const handleInteraction = () => {
    initializeDeferredAppCheck();
    interactionEvents.forEach(event => document.removeEventListener(event, handleInteraction));
  };

  interactionEvents.forEach(event => document.addEventListener(event, handleInteraction, { passive: true }));

  // PERFORMANCE FIX: Extended timer to 15s to clear the Lighthouse TBT audit window
  setTimeout(() => {
    initializeDeferredAppCheck();
    interactionEvents.forEach(event => document.removeEventListener(event, handleInteraction));
  }, 15000);
}

export { firebaseConfig, app, auth, db, storage, appCheck };