"use server";

import { adminDb } from "@/lib/firebase/admin";

export async function getOutfitterStats(uid: string) {
  try {
    // 1. Get profile to check their approval status and Tier
    const outfitterDoc = await adminDb.collection("outfitters").doc(uid).get();
    if (!outfitterDoc.exists) {
      return { success: false, error: "Outfitter profile not found." };
    }
    const profile = outfitterDoc.data();

    // 2. Resolve Tier Logic
    const isPromoActive = profile?.promoExpiresAt && new Date(profile.promoExpiresAt) > new Date();
    const effectiveTier = (isPromoActive || profile?.tier === "PRO" || profile?.tier === "pro") ? "PRO" : "STANDARD";

    // 3. Get only their specific hunts
    const huntsSnap = await adminDb.collection("hunts").where("outfitterId", "==", uid).get();
    const hunts = huntsSnap.docs.map(doc => doc.data());

    // 4. Calculate KPIs with Soft Lock enforced
    let activeHunts = hunts.filter(h => h.status === "APPROVED").length;
    
    // If they are Standard, they cannot have more than 5 active hunts showing
    if (effectiveTier === "STANDARD" && activeHunts > 5) {
      activeHunts = 5; 
    }

    const pendingHunts = hunts.filter(h => h.status === "PENDING").length;

    return {
      success: true,
      data: {
        status: profile?.status || "PENDING",
        name: profile?.name || "Outfitter",
        tier: effectiveTier, // Send the resolved tier back to the dashboard
        activeHunts,
        pendingHunts,
        totalInquiries: 0 
      }
    };
  } catch (error: any) {
    console.error("Error fetching outfitter stats:", error);
    return { success: false, error: error.message };
  }
}