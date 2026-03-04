'use server';

import { adminDb } from '@/lib/firebase/admin';
import { z } from 'zod';

const HuntSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Please provide a detailed description'),
  price: z.coerce.number().min(1, 'Price must be greater than 0'),
  location: z.string().min(2, 'Location is required'),
  species: z.string().min(2, 'List at least one species'),
  status: z.enum(['draft', 'published', 'active']),
  imageUrl: z.string().optional(),
});

export type HuntFormData = z.infer<typeof HuntSchema>;

export async function createHunt(data: HuntFormData, outfitterId: string) {
  try {
    const parsedData = HuntSchema.parse(data);
    const payload = {
      ...parsedData,
      outfitterId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const docRef = await adminDb.collection('hunts').add(payload);
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
      .where('status', 'in', ['published', 'active']) 
      .orderBy('createdAt', 'desc')
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
