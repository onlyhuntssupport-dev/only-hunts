"use server";

import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";

function sanitizeData(doc: any) {
  const data = doc.data();
  let createdAt = data.createdAt || null;
  
  if (createdAt && typeof createdAt.toDate === 'function') {
    createdAt = createdAt.toDate().toISOString();
  } else if (createdAt) {
    createdAt = new Date(createdAt).toISOString();
  }

  return { id: doc.id, ...data, createdAt };
}

// --- UPDATED FUNCTION: Sync User Profile with Legal Audit Trail ---
export async function syncUserProfile(data: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  termsVersion?: string;
}) {
  try {
    const userRef = adminDb.collection("users").doc(data.uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      // Create a brand new user in the database with legal logging
      const newUserData = {
        email: data.email,
        name: data.displayName || data.email?.split('@')[0] || 'Unknown',
        photoURL: data.photoURL || null,
        role: data.role,
        status: "ACTIVE", 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        termsAccepted: data.termsAccepted || false,
        termsAcceptedAt: data.termsAcceptedAt || null,
        termsVersion: data.termsVersion || null
      };
      await userRef.set(newUserData);
      
      await adminAuth.setCustomUserClaims(data.uid, { role: data.role });

      return { success: true, role: data.role };
    } else {
      // User already exists, update login time
      const existingData = userSnap.data();
      const existingRole = existingData?.role || 'HUNTER';

      await userRef.update({
        lastLoginAt: new Date().toISOString()
      });

      return { success: true, role: existingRole };
    }
  } catch (error: any) {
    console.error("Error syncing user profile:", error);
    return { success: false, error: error.message };
  }
}
// --------------------------------------------------------

export async function getOutfitters() {
  try {
    const snap = await adminDb.collection("users").where("role", "==", "OUTFITTER").get();
    return { success: true, data: snap.docs.map(sanitizeData) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAdmins() {
  try {
    const snap = await adminDb.collection("users").where("role", "in", ["SUPER_ADMIN", "ADMIN", "MODERATOR"]).get();
    return { success: true, data: snap.docs.map(sanitizeData) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAdminAccount(uid: string) {
  try {
    await adminAuth.deleteUser(uid);
    await adminDb.collection("users").doc(uid).delete();
    revalidatePath("/dashboard/admins");
    return { success: true };
  } catch (error: any) {
    console.error("Deletion error:", error);
    return { success: false, error: error.message || "Failed to permanently delete account." };
  }
}

export async function updateOutfitterStatus(id: string, status: "ACTIVE" | "REJECTED", reason?: string) {
  try {
    const updateData: any = { status, statusUpdatedAt: new Date().toISOString() };
    if (status === "REJECTED" && reason) updateData.rejectionReason = reason;
    await adminDb.collection("users").doc(id).update(updateData);
    revalidatePath("/dashboard/outfitters");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createOutfitter(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const permitUrl = formData.get("permitUrl") as string;
    if (!name || !email || !password || !permitUrl) return { success: false, error: "Missing fields" };
    const userRecord = await adminAuth.createUser({ email, password, displayName: name });
    await adminDb.collection("users").doc(userRecord.uid).set({
      name, email, role: "OUTFITTER", status: "ACTIVE", permitUrl,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });
    revalidatePath("/dashboard/outfitters");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}