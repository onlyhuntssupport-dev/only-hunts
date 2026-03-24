"use server";

import { adminDb } from "@/lib/firebase/admin";

export async function getOutfitterStats(uid: string) {
  try {
    // 1. Get profile to check their approval status
    const outfitterDoc = await adminDb.collection("outfitters").doc(uid).get();
    if (!outfitterDoc.exists) {
      return { success: false, error: "Outfitter profile not found." };
    }
    const profile = outfitterDoc.data();

    // 2. Get only their specific hunts
    const huntsSnap = await adminDb.collection("hunts").where("outfitterId", "==", uid).get();
    const hunts = huntsSnap.docs.map(doc => doc.data());

    // 3. Calculate KPIs
    const activeHunts = hunts.filter(h => h.status === "APPROVED").length;
    const pendingHunts = hunts.filter(h => h.status === "PENDING").length;

    return {
      success: true,
      data: {
        status: profile?.status || "PENDING",
        name: profile?.name || "Outfitter",
        activeHunts,
        pendingHunts,
        totalInquiries: 0 // Placeholder until we build the leads module
      }
    };
  } catch (error: any) {
    console.error("Error fetching outfitter stats:", error);
    return { success: false, error: error.message };
  }
}