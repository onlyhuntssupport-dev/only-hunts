import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';
import { firebaseApp } from '@/firebase/config';

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export async function registerNewOutfitter(email: string, password: string, companyName: string) {
  try {
    // 1. Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Calculate exactly 14 days from right now
    const trialExpirationDate = new Date();
    trialExpirationDate.setDate(trialExpirationDate.getDate() + 14);

    // 3. Build the Outfitter Profile Payload
    const outfitterData = {
      uid: user.uid,
      email: user.email,
      companyName: companyName,
      createdAt: Timestamp.now(),
      
      // The SaaS Trial Engine Logic
      tier: 'free_trial',
      subscriptionEndsAt: Timestamp.fromDate(trialExpirationDate),
      isAdminOverride: false,
      
      // Default Profile States
      isVerified: false,
      stripeConnected: false, // Or paystack connected
    };

    // 4. Save to Firestore
    await setDoc(doc(db, 'outfitters', user.uid), outfitterData);

    return { success: true, user };
    
  } catch (error: any) {
    console.error("Outfitter Registration Error:", error);
    return { success: false, error: error.message };
  }
}