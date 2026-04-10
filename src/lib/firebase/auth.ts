'use client';

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { firebaseApp } from '@/firebase/config';

export const auth = getAuth(firebaseApp);

const googleProvider = new GoogleAuthProvider();

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();

    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    return result.user;
  } catch (error: any) {
    // FIXED: Only log actual failures, ignore intentional user cancellations
    if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
      console.error('Google Sign-In Error:', error);
    }
    throw error; 
  }
}

export async function signInWithApple(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    const idToken = await result.user.getIdToken();

    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    return result.user;
  } catch (error: any) {
    // FIXED: Only log actual failures, ignore intentional user cancellations
    if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
      console.error('Apple Sign-In Error:', error);
    }
    throw error; 
  }
}

export async function logOut() {
  try {
    await firebaseSignOut(auth);
    await fetch('/api/auth/session', { method: 'DELETE' });
    window.location.assign('/');
  } catch (error) {
    console.error('Sign Out Error:', error);
  }
}