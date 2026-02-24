'use server';

import { adminDb } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';
import { Hunt, HuntSchema } from '@/lib/validations/hunt';
import { z } from 'zod';

// We don't want the client sending these fields, as they are controlled by the server.
const HuntCreationData = HuntSchema.omit({ id: true, isVerified: true });

export async function createHunt(data: z.infer<typeof HuntCreationData>) {
  try {
    const validatedData = HuntCreationData.parse(data);

    const docRef = await adminDb.collection('hunts').add({
      ...validatedData,
      // Overwrite client-side timestamp with a secure server-side one
      createdAt: new Date(), 
      isVerified: false, // Ensure all new hunts start as unverified
    });

    revalidatePath('/hunts');
    revalidatePath('/outfitter/dashboard');
    
    return { success: true, huntId: docRef.id };
  } catch (error) {
    console.error("Failed to create hunt:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed.", issues: error.errors };
    }
    return { success: false, error: "An unknown error occurred while creating the hunt." };
  }
}
