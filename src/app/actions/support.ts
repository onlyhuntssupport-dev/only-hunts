"use server";

import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export async function submitSupportTicket(payload: {
  category: "BOOKING_ISSUE" | "SAFETY_CONCERN" | "TECH_ISSUE";
  message: string;
}) {
  try {
    // 1. Authenticate the User making the request
    // BUG FIX: cookies() is async in Next.js 15+, so we must await it first
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    
    if (!sessionCookie) throw new Error("Unauthorized. Please log in.");

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const uid = decodedClaims.uid;

    // 2. Fetch User Details to attach to the ticket
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) throw new Error("User profile not found.");
    
    const userData = userDoc.data();

    // 3. Construct the Ticket Payload
    const ticketData = {
      userId: uid,
      userName: userData?.name || userData?.companyName || "Unknown User",
      userEmail: userData?.email || "No Email",
      userRole: userData?.role || "UNKNOWN",
      category: payload.category,
      message: payload.message,
      status: "OPEN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 4. Write to the new 'supportTickets' collection
    const ticketRef = await adminDb.collection("supportTickets").add(ticketData);

    return { 
      success: true, 
      ticketId: ticketRef.id,
      message: "Ticket submitted successfully." 
    };

  } catch (error: any) {
    console.error("Failed to submit support ticket:", error);
    return { 
      success: false, 
      error: error.message || "Failed to submit request." 
    };
  }
}