"use server";

import { adminDb } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Helper to clean up Firestore timestamps for the frontend
function sanitizeHunt(doc: any) {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
  };
}

export async function getAllHunts() {
  try {
    const snap = await adminDb.collection("hunts").orderBy("createdAt", "desc").get();
    return { success: true, data: snap.docs.map(sanitizeHunt) };
  } catch (error: any) {
    console.error("Error fetching hunts:", error);
    return { success: false, error: error.message };
  }
}

export async function updateHuntStatus(huntId: string, status: "APPROVED" | "REJECTED", note?: string) {
  try {
    await adminDb.collection("hunts").doc(huntId).update({
      status: status,
      adminNote: note || "",
      reviewedAt: new Date().toISOString(),
    });

    revalidatePath("/dashboard/hunts");
    revalidatePath("/"); // NEW: Forces the homepage to refresh its snapshot!
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getHuntById(id: string) {
  try {
    const doc = await adminDb.collection("hunts").doc(id).get();
    if (!doc.exists) {
      return { success: false, error: "Hunt not found." };
    }
    
    const data = doc.data()!;
    return { 
      success: true, 
      data: {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
      }
    };
  } catch (error: any) {
    console.error("Error fetching hunt:", error);
    return { success: false, error: error.message };
  }
}

export async function createHuntListing(huntData: any, outfitterId: string) {
  try {
    const outfitterDoc = await adminDb.collection("outfitters").doc(outfitterId).get();
    
    // Security check: Only ACTIVE outfitters can post
    if (!outfitterDoc.exists || outfitterDoc.data()?.status !== "ACTIVE") {
      return { success: false, error: "Your account must be ACTIVE to publish listings." };
    }

    const newHunt = {
      ...huntData,
      outfitterId,
      status: "PENDING", // Forces admin review before going live
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection("hunts").add(newHunt);

    // Increment outfitter's total listings stat
    await adminDb.collection("outfitters").doc(outfitterId).update({
      totalListings: FieldValue.increment(1)
    });

    revalidatePath("/outfitter/dashboard");
    revalidatePath("/outfitter/dashboard/hunts");
    revalidatePath("/dashboard"); 

    return { success: true, huntId: docRef.id };
  } catch (error: any) {
    console.error("Error creating hunt:", error);
    return { success: false, error: error.message };
  }
}

// --- NEW FUNCTION: PERMANENTLY DELETE A HUNT & ITS IMAGES ---
export async function deleteHunt(huntId: string) {
  try {
    const huntDoc = await adminDb.collection("hunts").doc(huntId).get();
    if (!huntDoc.exists) {
      return { success: false, error: "Hunt not found." };
    }

    const huntData = huntDoc.data();
    const outfitterId = huntData?.outfitterId;

    // 1. Gather any attached images (handles both single strings and arrays)
    const imagesToScrub: string[] = [];
    if (huntData?.imageUrl) imagesToScrub.push(huntData.imageUrl);
    if (huntData?.coverImage) imagesToScrub.push(huntData.coverImage);
    if (Array.isArray(huntData?.images)) imagesToScrub.push(...huntData.images);

    // 2. Delete the actual image files from the Firebase Storage Bucket
    for (const url of imagesToScrub) {
      if (typeof url === 'string' && url.includes("firebasestorage.googleapis.com")) {
        try {
          const urlObj = new URL(url);
          const parts = urlObj.pathname.split('/o/');
          if (parts.length === 2) {
            const bucketName = parts[0].split('/b/')[1];
            const filePath = decodeURIComponent(parts[1]);
            // Tell the admin storage to delete the specific file
            await getStorage().bucket(bucketName).file(filePath).delete();
          }
        } catch (imgError) {
          console.error("Failed to delete image from storage:", imgError);
          // Fails silently for images so the database document still gets deleted
        }
      }
    }

    // 3. Delete the hunt document from Firestore
    await adminDb.collection("hunts").doc(huntId).delete();

    // 4. Decrement the outfitter's stat so their count stays accurate
    if (outfitterId) {
      await adminDb.collection("outfitters").doc(outfitterId).update({
        totalListings: FieldValue.increment(-1)
      });
    }

    revalidatePath("/dashboard/hunts");
    revalidatePath("/outfitter/dashboard");
    revalidatePath("/"); // NEW: Also refresh homepage when a hunt is deleted!
    
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting hunt:", error);
    return { success: false, error: error.message };
  }
}