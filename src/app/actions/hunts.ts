
'use server';

import { adminDb } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';
import { Hunt, HuntSchema } from '@/lib/validations/hunt';
import { z } from 'zod';
import { firestore } from 'firebase-admin';

// We don't want the client sending these fields, as they are controlled by the server.
const HuntCreationData = HuntSchema.omit({ 
    id: true, 
    isVerified: true, 
    status: true, 
    approvedAt: true,
    createdAt: true,
    leadCount: true,
    viewCount: true,
    lastViewedAt: true,
});

export async function createHunt(data: z.infer<typeof HuntCreationData>) {
  try {
    const validatedData = HuntCreationData.parse(data);

    const docRef = await adminDb.collection('hunts').add({
      ...validatedData,
      createdAt: new Date(), 
      isVerified: false, // Outfitter verification status cascades separately
      status: 'pending', // All new hunts require admin approval
      leadCount: 0,
      viewCount: 0,
    });

    revalidatePath('/hunts');
    revalidatePath('/outfitter/dashboard');
    revalidatePath('/outfitter/dashboard/hunts');
    
    return { success: true, huntId: docRef.id };
  } catch (error) {
    console.error("Failed to create hunt:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed.", issues: error.errors };
    }
    return { success: false, error: "An unknown error occurred while creating the hunt." };
  }
}

export async function getOutfitterHunts(outfitterId: string) {
  try {
    const snapshot = await adminDb
      .collection('hunts')
      .where('outfitterId', '==', outfitterId)
      .orderBy('createdAt', 'desc')
      .get();
      
    const hunts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Convert Firestore Timestamps to strings for client-side serialization
    const serializableHunts = hunts.map(hunt => {
        const serializableHunt: { [key: string]: any } = { id: hunt.id };
        for (const key in hunt) {
            if (hunt[key] instanceof firestore.Timestamp) {
                serializableHunt[key] = hunt[key].toDate().toISOString();
            } else {
                serializableHunt[key] = hunt[key];
            }
        }
        return serializableHunt;
    });

    return { success: true, hunts: serializableHunts };
  } catch (error) {
    console.error('Error fetching hunts:', error);
    return { success: false, error: 'Failed to fetch hunts', hunts: [] };
  }
}

export async function deleteHunt(huntId: string) {
  try {
    await adminDb.collection('hunts').doc(huntId).delete();
    revalidatePath('/outfitter/dashboard/hunts');
    revalidatePath('/outfitter/dashboard');
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
      .where('status', '==', 'active') // Changed to 'active' to match schema
      .orderBy('createdAt', 'desc')
      .get();
      
    const hunts = snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamps to strings for client-side serialization
        const serializableData: { [key: string]: any } = { id: doc.id };
        for (const key in data) {
            if (data[key] instanceof firestore.Timestamp) {
                serializableData[key] = data[key].toDate().toISOString();
            } else {
                serializableData[key] = data[key];
            }
        }
        return serializableData;
    });

    return { success: true, hunts };
  } catch (error) {
    console.error('Error fetching published hunts:', error);
    return { success: false, error: 'Failed to load the marketplace', hunts: [] };
  }
}

export async function getHuntById(id: string) {
    try {
      const docSnap = await adminDb.collection('hunts').doc(id).get();
      
      if (!docSnap.exists) {
        return { success: false, error: 'Hunt not found', hunt: null };
      }
  
      const data = docSnap.data();
      // Ensure Timestamps are serialized for the client
      const serializableData: { [key:string]: any } = { id: docSnap.id };
      for (const key in data) {
          if (data[key] instanceof firestore.Timestamp) {
              serializableData[key] = data[key].toDate().toISOString();
          } else {
              serializableData[key] = data[key];
          }
      }
  
      return { 
        success: true, 
        hunt: serializableData
      };
    } catch (error) {
      console.error('Error fetching hunt by ID:', error);
      return { success: false, error: 'Failed to fetch hunt details', hunt: null };
    }
}
