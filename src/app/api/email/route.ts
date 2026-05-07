import { NextResponse } from "next/server";
import { Resend } from "resend";
import PlatformNotification from "@/components/emails/PlatformNotification";
import * as admin from "firebase-admin";

// --- SECURE FIREBASE ADMIN INITIALIZATION ---
// Prevents Next.js hot-reloading from initializing Firebase multiple times
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The replace method ensures newline characters in the env file format correctly
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // --- 1. THE SECURITY CHECK (THE BOUNCER) ---
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing or invalid authentication token." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    
    try {
      // Verify the token belongs to a real, authenticated Only-Hunts user
      await admin.auth().verifyIdToken(token);
    } catch (err) {
      console.error("Token verification failed:", err);
      return NextResponse.json({ error: "Unauthorized: Token expired or invalid." }, { status: 401 });
    }
    // --- END SECURITY CHECK ---

    // --- 2. PROCESS THE EMAIL ---
    const body = await request.json();
    const { to, subject, userName, title, message, ctaText, ctaLink } = body;

    // Basic validation
    if (!to || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Send the email using the React template
    const { data, error } = await resend.emails.send({
      from: "Only-Hunts <onboarding@resend.dev>", // Update once domain is verified in Resend
      to: [to], 
      subject: subject,
      react: PlatformNotification({ userName, title, message, ctaText, ctaLink }),
    });

    if (error) {
      console.error("Resend API Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "Failed to process email request" }, { status: 500 });
  }
}