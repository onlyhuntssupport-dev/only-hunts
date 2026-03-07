'use server';

import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// 1. Missing createSession function added
export async function createSession(idToken: string) {
  const cookieStore = await cookies();
  
  cookieStore.set('session', idToken, {
    maxAge: 60 * 60 * 24 * 5, // 5 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

// 2. Your existing role management function (untouched)
export async function setUserRole(uid: string, role: 'HUNTER' | 'OUTFITTER') {
  try {
    await adminAuth.setCustomUserClaims(uid, { role });

    await adminDb.collection('users').doc(uid).update({
      role: role,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath('/'); 
    return { success: true };
  } catch (error) {
    console.error("Failed to set user role:", error);
    return { success: false, error: "Authorization failed" };
  }
}

// 3. Fixed Next.js 15 async cookie bug
export async function serverLogOut() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  redirect('/login');
}