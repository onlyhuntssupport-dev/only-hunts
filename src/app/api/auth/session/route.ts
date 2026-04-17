import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getFirebaseAuth } from "next-firebase-auth-edge";
import { adminDb } from "@/lib/firebase/admin";

// Initialize the edge auth library
const { createAuthCookie } = getFirebaseAuth({
  serviceAccount: {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
  },
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    // 1. Decode the token to get the user ID
    const decodedToken = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
    const uid = decodedToken.user_id;

    // 2. Fetch the user's role from Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const role = userDoc.exists ? userDoc.data()?.role : "HUNTER"; // Default fallback

    // 3. Create the secure edge-compatible cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const authCookie = await createAuthCookie(idToken, { expiresIn });

    // Next.js 15 requires awaiting cookies()
    const cookieStore = await cookies();
    
    cookieStore.set("AuthToken", authCookie.value, {
      maxAge: authCookie.maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    // Store the role for the middleware to read instantly
    cookieStore.set("UserRole", role, {
      maxAge: authCookie.maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Session Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  // Purge both cookies when the user logs out
  const cookieStore = await cookies();
  cookieStore.delete("AuthToken");
  cookieStore.delete("UserRole");
  
  return NextResponse.json({ success: true }, { status: 200 });
}