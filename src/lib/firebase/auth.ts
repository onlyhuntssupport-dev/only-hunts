'use client';

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { firebaseApp } from '@/firebase/config';

export const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();

    // Send token to our Next.js server to mint a session cookie
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    return null;
  }
}

export async function logOut() {
  try {
    await firebaseSignOut(auth);
    // Request that the server clear the session cookie
    await fetch('/api/auth/session', { method: 'DELETE' });
    // Redirect to home page after sign out
    window.location.assign('/');
  } catch (error) {
    console.error('Sign Out Error:', error);
  }
}
