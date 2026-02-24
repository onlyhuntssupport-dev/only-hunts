
'use server';

import { adminDb } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';
import { firestore } from 'firebase-admin';

export async function toggleWishlist(hunterId: string, huntId: string) {
  const wishlistRef = adminDb.collection('wishlists').doc(hunterId);
  const doc = await wishlistRef.get();

  try {
    if (!doc.exists) {
      await wishlistRef.set({ huntIds: [huntId] });
    } else {
      const data = doc.data();
      const isSaved = data?.huntIds?.includes(huntId);
      
      await wishlistRef.update({
        huntIds: isSaved 
          ? firestore.FieldValue.arrayRemove(huntId) 
          : firestore.FieldValue.arrayUnion(huntId)
      });
    }

    revalidatePath(`/hunts/${huntId}`);
    revalidatePath(`/hunter/dashboard`);
    return { success: true, isSaved: !doc.exists || !doc.data()?.huntIds?.includes(huntId) };
  } catch (error) {
    console.error("Wishlist toggle error:", error);
    return { success: false, error: "Failed to update wishlist." };
  }
}
