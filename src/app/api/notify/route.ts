import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

export async function POST(request: Request) {
  try {
    const { token, title, body } = await request.json();

    // --- SECURE AUTHORIZATION ---
    // Pulling credentials securely from your .env.local file
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });

    const accessToken = await auth.getAccessToken();
    const projectId = process.env.FIREBASE_PROJECT_ID;

    // --- SEND VIA HTTP v1 API ---
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: token,
            notification: {
              title: title,
              body: body,
            },
          },
        }),
      }
    );

    const result = await response.json();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Push Error:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}