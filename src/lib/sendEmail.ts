// File: src/lib/sendEmail.ts
import { auth } from "@/lib/firebase/client";

interface EmailPayload {
  to: string;
  subject: string;
  templateName: 'welcome-email' | 'booking-request' | 'transaction-receipt';
  variables?: Record<string, string | number>;
}

export async function sendEmailTemplate(payload: EmailPayload) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User must be authenticated to send emails.");
    }

    // Securely get the fresh Firebase token
    const token = await currentUser.getIdToken();

    const response = await fetch("/api/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send email");
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email dispatch error:", error);
    return { success: false, error };
  }
}