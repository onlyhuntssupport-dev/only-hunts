"use server";

import { adminDb } from "@/lib/firebase/admin";
import { Resend } from "resend";

// Safely grab the key, or default to a dummy string to prevent crashes
const resendApiKey = process.env.RESEND_API_KEY || "dummy_key";
const resend = new Resend(resendApiKey);

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

    // 2. Email Notification (Mocks if using a dummy key)
    if (resendApiKey === "dummy_key" || !resendApiKey.startsWith("re_")) {
      console.log("🛠️ [DEV MODE] Resend API key missing or invalid. Email mocked successfully.");
      console.log(`✉️ Would have sent to: ${hunterEmail}\nSubject: We received your inquiry for ${huntTitle}!`);
      return { success: true, mocked: true };
    }

    // 3. Live Email Execution
    const { data, error } = await resend.emails.send({
      from: "Only-Hunts <notifications@yourdomain.com>", // Update this later
      to: [hunterEmail],
      subject: `We received your inquiry for ${huntTitle}!`,
      text: messageBodyText,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: "Email failed to send" };
    }

    return { success: true };
  } catch (error) {
    console.error("Auto-reply error:", error);
    return { success: false, error: "Failed to trigger auto-reply" };
  }
}