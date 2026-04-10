"use server";

import { adminDb } from "@/lib/firebase/admin";
import { sendPlatformEmail } from "@/lib/email/sender"; // NEW CENTRAL UTILITY

export async function triggerOutfitterAutoReply(
  hunterId: string,
  hunterEmail: string,
  hunterName: string,
  outfitterName: string,
  huntTitle: string
) {
  try {
    const messageBodyText = `Hi ${hunterName},\n\nThanks for reaching out about the ${huntTitle} package! I am currently out in the bush creating unforgettable memories with clients, but I have received your request.\n\nI will review your details and get back to you personally within 48 hours. Looking forward to planning your adventure and sharing the campfire with you soon!\n\nYours in hunting,\n${outfitterName}`;

    // 1. In-App Notification (Always runs)
    await adminDb.collection("users").doc(hunterId).collection("notifications").add({
      title: `Auto-Reply: ${outfitterName}`,
      message: messageBodyText,
      type: "INQUIRY_RECEIVED",
      read: false,
      createdAt: new Date().toISOString(),
    });

    // 2. Live Email Execution via Central Utility
    const emailResult = await sendPlatformEmail({
      to: hunterEmail,
      subject: `We received your inquiry for ${huntTitle}!`,
      text: messageBodyText,
    });

    if (!emailResult.success) {
      return { success: false, error: "Email failed to send" };
    }

    return { success: true };
  } catch (error) {
    console.error("Auto-reply error:", error);
    return { success: false, error: "Failed to trigger auto-reply" };
  }
}