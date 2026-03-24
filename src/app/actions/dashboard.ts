"use server";

import { adminDb } from "@/lib/firebase/admin";

export async function getDashboardStats() {
  try {
    const huntsSnap = await adminDb.collection("hunts").get();
    const hunts = huntsSnap.docs.map(doc => doc.data());

    const totalHunts = hunts.length;
    const pendingHunts = hunts.filter(h => h.status === "PENDING").length;
    const approvedHunts = hunts.filter(h => h.status === "APPROVED").length;
    const totalValue = hunts.reduce((sum, h) => sum + (h.price || 0), 0);

    return {
      success: true,
      data: {
        totalHunts,
        pendingHunts,
        approvedHunts,
        totalValue
      }
    };
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return { success: false, error: error.message };
  }
}