'use server';

import { adminDb } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';
import type { Hunt } from '@/lib/validations/hunt';

// This is a simplified type for the incoming form data,
// as the full Hunt type includes server-generated fields.
// The species is an array, matching the form's output.
interface HuntCreationData {
  title: string;
  description: string;
  basePrice: number;
  baseCurrency: 'USD' | 'EUR' | 'ZAR';
  province: string;
  species: string[];
  imageUrl: string;
  outfitterName: string;
}

export async function createHunt(data: HuntCreationData, outfitterId: string) {
  try {
    // Data is assumed to be validated by the form before calling this action.
    const payload: Omit<Hunt, 'id' | 'createdAt' | 'approvedAt' | 'lastViewedAt'> = {
      ...data,
      outfitterId,
      isVerified: false, // Outfitters themselves need verification first
      status: 'pending', // All new hunts require admin approval
    };

    const docRef = await adminDb.collection('hunts').add({
      ...payload,
      createdAt: new Date().toISOString(),
    });
    
    revalidatePath('/outfitter/dashboard/hunts'); // Revalidate the hunts table
    revalidatePath('/'); // Revalidate homepage feed
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating hunt:', error);
    return { success: false, error: 'Failed to create hunting package.' };
  }
}

export async function getOutfitterHunts(outfitterId: string) {
  try {
    const snapshot = await adminDb
      .collection('hunts')
      .where('outfitterId', '==', outfitterId)
      .orderBy('createdAt', 'desc')
      .get();
      
    const hunts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, hunts };
  } catch (error) {
    console.error('Error fetching hunts:', error);
    return { success: false, error: 'Failed to fetch hunts', hunts: [] };
  }
}

export async function deleteHunt(huntId: string) {
  try {
    await adminDb.collection('hunts').doc(huntId).delete();
    revalidatePath('/outfitter/dashboard/hunts');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting hunt:', error);
    return { success: false, error: 'Failed to delete hunt' };
  }
}

export async function getPublishedHunts() {
  try {
    const snapshot = await adminDb
      .collection('hunts')
      // Only show hunts that are both active and from a verified outfitter
      .where('status', '==', 'active')
      .where('isVerified', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
      
    const hunts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, hunts };
  } catch (error) {
    console.error('Error fetching published hunts:', error);
    return { success: false, error: 'Failed to load the marketplace', hunts: [] };
  }
}

export async function getHuntById(id: string) {
  try {
    const docSnap = await adminDb.collection('hunts').doc(id).get();
    if (!docSnap.exists) return { success: false, error: 'Hunt not found' };
    return { success: true, hunt: { id: docSnap.id, ...docSnap.data() } as any };
  } catch (error) {
    console.error('Error fetching hunt by ID:', error);
    return { success: false, error: 'Failed to fetch hunt details' };
  }
}
