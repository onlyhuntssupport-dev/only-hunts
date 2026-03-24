'use server';

import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

export async function login(idToken: string) {
  try {
    // Create a session cookie valid for 5 days
    const expiresIn = 60 * 60 * 24 * 5 * 1000; 
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return { success: true };
  } catch (error: any) {
    console.error('Session creation error:', error);
    return { error: 'Failed to create secure session.' };
  }
}

export async function logout() {
  try {
    // Destroy the secure Next.js session cookie
    const cookieStore = await cookies();
    cookieStore.delete('session');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to delete session cookie:', error);
    return { success: false };
  }
}