"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

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
    // Only fetch ads that are both ACTIVE and fully PAID
    const snapshot = await adminDb.collection("sponsoredAds")
      .where("isActive", "==", true)
      .where("paymentStatus", "==", "PAID")
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
      placement: formData.get("placement") as string || "IN_FEED",
      
      // Financial Tracking Fields
      billingAmount: Number(formData.get("billingAmount")) || 0,
      billingEmail: formData.get("billingEmail") as string || "",
      billingCycle: formData.get("billingCycle") as string || "ONE_TIME",
      
      // Safety Defaults: Starts inactive and pending payment
      paymentStatus: "PENDING_PAYMENT",
      isActive: false, 
      
      clicks: 0,
      impressions: 0,
      createdAt: new Date().toISOString()
    };

    const docRef = await adminDb.collection("sponsoredAds").add(newDoc);
    
    revalidatePath("/admin/ads");
    revalidatePath("/");
    revalidatePath("/marketplace");
    
    // RETURN FIX: Added 'id' alongside 'adId' so the UI correctly routes it to Paystack
    return { success: true, id: docRef.id, adId: docRef.id };
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

export async function toggleAdStatus(id: string, currentStatus: boolean, updatePaymentToPaid: boolean = false) {
  try {
    const updateData: any = { isActive: !currentStatus };
    
    // If the admin manually forces a pending ad to go live, flip it to PAID
    if (updatePaymentToPaid) {
      updateData.paymentStatus = "PAID";
    }

    await adminDb.collection("sponsoredAds").doc(id).update(updateData);
    
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
      clicks: FieldValue.increment(1)
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
      impressions: FieldValue.increment(1) 
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error recording ad impression:", error);
    return { success: false };
  }
}