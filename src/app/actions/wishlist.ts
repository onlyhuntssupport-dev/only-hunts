'use server';

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

export async function toggleWishlist(hunterId: string, huntId: string) {
  try {
    const wishlistRef = adminDb.collection('wishlists').doc(hunterId);
    const huntRef = adminDb.collection('hunts').doc(huntId);
    
    // Check the current state
    const wishlistDoc = await wishlistRef.get();
    let currentlySaved = false;

    if (wishlistDoc.exists) {
      const data = wishlistDoc.data();
      const huntIds = data?.huntIds || [];
      currentlySaved = huntIds.includes(huntId);
    }

    // We use a Firestore Batch to ensure BOTH databases update safely at the exact same time
    const batch = adminDb.batch();

    if (currentlySaved) {
      // 1. Remove from Hunter's Wishlist
      batch.update(wishlistRef, {
        huntIds: FieldValue.arrayRemove(huntId)
      });
      // 2. Decrement the Outfitter's tracking tally
      batch.update(huntRef, {
        saveCount: FieldValue.increment(-1)
      });
      currentlySaved = false;
      
    } else {
      // 1. Add to Hunter's Wishlist
      if (!wishlistDoc.exists) {
        batch.set(wishlistRef, { huntIds: [huntId] });
      } else {
        batch.update(wishlistRef, {
          huntIds: FieldValue.arrayUnion(huntId)
        });
      }
      // 2. Increment the Outfitter's tracking tally (The Blind Offer Tracker!)
      batch.update(huntRef, {
        saveCount: FieldValue.increment(1)
      });
      currentlySaved = true;
    }

    // Commit both changes simultaneously
    await batch.commit();

    // Revalidate the hunt page so the cache clears
    revalidatePath(`/hunts/${huntId}`);

    return { success: true, isSaved: currentlySaved };
    
  } catch (error: any) {
    console.error("Wishlist Toggle Error:", error);
    return { success: false, error: error.message || "Failed to update wishlist" };
  }
}