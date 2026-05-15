import { NextResponse } from "next/server";
import { Resend } from "resend";
import * as admin from "firebase-admin";
import { readFileSync } from "fs";
import { join } from "path";

// --- SECURE FIREBASE ADMIN INITIALIZATION ---
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
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
      await admin.auth().verifyIdToken(token);
    } catch (err) {
      console.error("Token verification failed:", err);
      return NextResponse.json({ error: "Unauthorized: Token expired or invalid." }, { status: 401 });
    }
    // --- END SECURITY CHECK ---

    // --- 2. PROCESS THE EMAIL ---
    const body = await request.json();
    
    // We now expect a templateName (e.g., 'booking-request') and an object of dynamic variables
    const { to, subject, templateName, variables } = body;

    if (!to || !subject || !templateName) {
      return NextResponse.json({ error: "Missing required fields: to, subject, or templateName" }, { status: 400 });
    }

    // --- 3. READ AND COMPILE THE HTML TEMPLATE ---
    let htmlContent = "";
    try {
      // Point directly to the emails folder at the root of the project
      const filePath = join(process.cwd(), "emails", `${templateName}.html`);
      htmlContent = readFileSync(filePath, "utf-8");
      
      // Inject the dynamic variables (replaces {{KEY}} with actual values)
      if (variables && typeof variables === "object") {
        for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`{{${key}}}`, "g");
          htmlContent = htmlContent.replace(regex, String(value));
        }
      }
    } catch (fsError) {
      console.error("Template read error:", fsError);
      return NextResponse.json({ error: "Failed to load the requested email template." }, { status: 500 });
    }

    // --- 4. SEND THE EMAIL ---
    const { data, error } = await resend.emails.send({
      from: "Only-Hunts <onboarding@resend.dev>", // Update once domain is verified
      to: [to], 
      subject: subject,
      html: htmlContent, // Sending raw HTML instead of the React component
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