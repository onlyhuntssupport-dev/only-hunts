"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";

export async function updatePlatformSettings(formData: FormData) {
  try {
    const commissionRate = parseFloat(formData.get("commissionRate") as string);
    const flatFee = parseFloat(formData.get("flatFee") as string);
    const supportEmail = formData.get("supportEmail") as string;

    if (isNaN(commissionRate) || isNaN(flatFee) || !supportEmail) {
      return { success: false, error: "Please provide valid numbers and email." };
    }

    // We store this in a dedicated 'system' collection under the 'settings' document
    await adminDb.collection("system").doc("settings").set({
      commissionRate,
      flatFee,
      supportEmail,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    revalidatePath("/dashboard/platform-settings");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating platform settings:", error);
    return { success: false, error: error.message || "Failed to update settings." };
  }
}