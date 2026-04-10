"use server";

import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";

// ============================================================================
// ADMIN DASHBOARD ACTIONS (Existing)
// ============================================================================

export async function getOutfitters() {
  try {
    const snap = await adminDb.collection("outfitters").orderBy("createdAt", "desc").get();
    const outfitters = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: outfitters };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateOutfitterStatus(id: string, status: string, rejectionReason?: string) {
  try {
    const updateData: any = { status, updatedAt: new Date().toISOString() };
    if (rejectionReason) updateData.rejectionReason = rejectionReason;
    
    await adminDb.collection("outfitters").doc(id).update(updateData);
    revalidatePath("/dashboard/outfitters");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createOutfitter(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const permitUrl = formData.get("permitUrl") as string;

    // 1. Create Firebase Auth User
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Create Firestore Document linked to Auth UID
    await adminDb.collection("outfitters").doc(userRecord.uid).set({
      name,
      email,
      permitUrl,
      status: "PENDING",
      totalListings: 0,
      createdAt: new Date().toISOString(),
    });

    revalidatePath("/dashboard/outfitters");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAdminAccount(id: string) {
  try {
    // 1. Delete from Firebase Auth
    await adminAuth.deleteUser(id).catch(() => console.log("User not in auth"));
    // 2. Delete from Firestore
    await adminDb.collection("outfitters").doc(id).delete();
    
    revalidatePath("/dashboard/outfitters");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


// ============================================================================
// MARKETPLACE ACTIONS (New)
// ============================================================================

/**
 * Securely fetches verified outfitters for the Homepage Carousel.
 * Runs on the server to bypass Firebase Client Security Rules.
 */
export async function getSecureVerifiedOutfitters() {
  try {
    const usersRef = adminDb.collection("users");
    
    // Fetch both casing variations of the role to ensure we get everyone
    const uppercaseSnapshot = await usersRef
      .where("role", "==", "OUTFITTER")
      .where("verificationStatus", "==", "VERIFIED")
      .limit(20)
      .get();
      
    const lowercaseSnapshot = await usersRef
      .where("role", "==", "outfitter")
      .where("verificationStatus", "==", "VERIFIED")
      .limit(20)
      .get();

    const combinedDocs = [...uppercaseSnapshot.docs, ...lowercaseSnapshot.docs];

    const fetched = combinedDocs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        companyName: data.companyName || data.name || "Verified Outfitter",
        location: data.location || "South Africa",
        profileImageUrl: data.profileImageUrl || "",
        coverImageUrl: data.coverImageUrl || "",
        rating: data.platformRating || 5.0,
        reviewCount: data.reviewCount || 0,
      };
    });

    // Server-side shuffle for fairness (Randomizes order)
    for (let i = fetched.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fetched[i], fetched[j]] = [fetched[j], fetched[i]];
    }

    return { success: true, data: fetched.slice(0, 20) };
  } catch (error) {
    console.error("Error securely fetching verified outfitters:", error);
    return { success: false, data: [] };
  }
}

/**
 * Securely fetches a single outfitter profile and their active hunts.
 * Added to fix the infinite loading screen on the Outfitter Storefront page.
 */
export async function getOutfitterProfileData(outfitterId: string) {
  try {
    const userDoc = await adminDb.collection("users").doc(outfitterId).get();
    if (!userDoc.exists) return { success: false, error: "Outfitter not found." };

    const huntsSnap = await adminDb.collection("hunts")
      .where("outfitterId", "==", outfitterId)
      .where("status", "==", "APPROVED")
      .get();

    const hunts = huntsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { 
      success: true, 
      outfitter: { id: userDoc.id, ...userDoc.data() }, 
      hunts 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}