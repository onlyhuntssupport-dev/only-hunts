"use server";

import { revalidatePath } from "next/cache";
import { adminDb, adminAuth } from "@/lib/firebase/admin";

// --- ADMIN MANAGEMENT ACTIONS ---

export async function createAdmin(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;

    if (!email || !password || !role) {
      return { success: false, error: "Missing required fields." };
    }

    // 1. Create the user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Create the user profile in Firestore
    await adminDb.collection("users").doc(userRecord.uid).set({
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/dashboard/admins");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating admin:", error);
    // Return clean error messages for the UI (e.g., "Email already in use")
    return { success: false, error: error.message || "Failed to create admin." };
  }
}

export async function deleteAdmin(adminId: string) {
  try {
    // 1. Delete from Firestore database
    await adminDb.collection("users").doc(adminId).delete();

    // 2. Delete from Firebase Authentication
    try {
      if (adminAuth) {
        await adminAuth.deleteUser(adminId);
      }
    } catch (authError: any) {
      console.warn("Auth user not found or already deleted:", authError.message);
    }

    revalidatePath("/dashboard/admins");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting admin:", error);
    return { success: false, error: error.message || "Failed to delete admin." };
  }
}

// --- PLATFORM APPROVAL & VERIFICATION ACTIONS ---

// 1. Verify an Outfitter
export async function verifyOutfitter(outfitterId: string) {
  try {
    await adminDb.collection("users").doc(outfitterId).update({
      status: "ACTIVE",
      isVerified: true,
      updatedAt: new Date().toISOString()
    });
    revalidatePath("/admin/verifications");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Reject an Outfitter
export async function rejectOutfitter(outfitterId: string) {
  try {
    await adminDb.collection("users").doc(outfitterId).update({
      status: "REJECTED",
      isVerified: false,
      updatedAt: new Date().toISOString()
    });
    revalidatePath("/admin/verifications");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Approve a Hunt Package
export async function approveHuntListing(huntId: string) {
  try {
    await adminDb.collection("hunts").doc(huntId).update({
      status: "APPROVED",
      updatedAt: new Date().toISOString()
    });
    revalidatePath("/admin/approvals");
    revalidatePath("/"); // Refresh homepage to show the new hunt
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Reject a Hunt Package
export async function rejectHuntListing(huntId: string, reason?: string) {
  try {
    await adminDb.collection("hunts").doc(huntId).update({
      status: "REJECTED",
      rejectionReason: reason || "Did not meet platform guidelines.",
      updatedAt: new Date().toISOString()
    });
    revalidatePath("/admin/approvals");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}