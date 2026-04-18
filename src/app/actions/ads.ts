"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore"; // <-- ADDED THIS IMPORT

// Utility to prevent Next.js Client Component crash from Firestore Timestamps
function serializeFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'object' && typeof obj.toDate === 'function') return obj.toDate().toISOString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(item => serializeFirestoreData(item));
  if (typeof obj === 'object') {
    const serialized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeFirestoreData(value);
    }
    return serialized;
  }
  return obj;
}

export async function getAds() {
  try {
    const snapshot = await adminDb.collection("sponsoredAds").orderBy("createdAt", "desc").get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: serializeFirestoreData(data) };
  } catch (error: any) {
    console.error("Error fetching ads:", error);
    return { success: false, error: "Failed to fetch campaigns." };
  }
}

export async function getActiveAdsByPlacement(placement: string) {
  try {
    const snapshot = await adminDb.collection("sponsoredAds")
      .where("isActive", "==", true)
      .where("placement", "==", placement)
      .get();
      
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: serializeFirestoreData(data) };
  } catch (error: any) {
    console.error(`Error fetching ${placement} ads:`, error);
    return { success: false, data: [] };
  }
}

export async function createAd(formData: FormData) {
  try {
    const advertiserName = formData.get("advertiserName") as string;
    
    if (!advertiserName) {
      return { success: false, error: "Advertiser Name is required." };
    }

    const newDoc = {
      advertiserName,
      imageUrl: formData.get("imageUrl") as string || "",
      targetUrl: formData.get("targetUrl") as string || "",
      placement: formData.get("placement") as string || "IN_FEED", // IN_FEED, CHECKOUT, SEARCH_TOP
      isActive: true,
      clicks: 0,
      impressions: 0,
      createdAt: new Date().toISOString()
    };

    await adminDb.collection("sponsoredAds").add(newDoc);
    
    revalidatePath("/admin/ads");
    revalidatePath("/");
    revalidatePath("/marketplace");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating ad:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteAd(id: string) {
  try {
    await adminDb.collection("sponsoredAds").doc(id).delete();
    revalidatePath("/admin/ads");
    revalidatePath("/");
    revalidatePath("/marketplace");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting ad:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleAdStatus(id: string, currentStatus: boolean) {
  try {
    await adminDb.collection("sponsoredAds").doc(id).update({ isActive: !currentStatus });
    revalidatePath("/admin/ads");
    revalidatePath("/");
    revalidatePath("/marketplace");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating ad status:", error);
    return { success: false, error: error.message };
  }
}

export async function recordAdClick(id: string) {
  try {
    const adRef = adminDb.collection("sponsoredAds").doc(id);
    await adRef.update({
      clicks: FieldValue.increment(1) // <-- FIXED
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error recording ad click:", error);
    return { success: false };
  }
}

export async function recordAdImpression(id: string) {
  try {
    const adRef = adminDb.collection("sponsoredAds").doc(id);
    await adRef.update({
      impressions: FieldValue.increment(1) // <-- FIXED
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error recording ad impression:", error);
    return { success: false };
  }
}