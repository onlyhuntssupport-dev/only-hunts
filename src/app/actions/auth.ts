'use server';

import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function login(idToken: string) {
  try {
    // Set session expiration to 7 days (in milliseconds for Firebase, seconds for Cookies)
    const expiresIn = 60 * 60 * 24 * 7 * 1000; 
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const cookieStore = await cookies();
    
    // Set the cookie in the browser
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000, // 7 days in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return { success: true };
  } catch (error: any) {
    console.error('Login error:', error);
    return { error: error.message || 'Failed to create session' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  return { success: true };
}