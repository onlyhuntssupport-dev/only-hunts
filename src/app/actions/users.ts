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

// PERMANENT DELETION LOGIC
export async function deleteAdminAccount(uid: string) {
  try {
    // 1. Delete from Firebase Authentication (The login)
    await adminAuth.deleteUser(uid);

    // 2. Delete from Firestore (The data)
    await adminDb.collection("users").doc(uid).delete();

    revalidatePath("/dashboard/admins");
    return { success: true };
  } catch (error: any) {
    console.error("Deletion error:", error);
    return { success: false, error: error.message || "Failed to permanently delete account." };
  }
}

// ... (keep createOutfitter and updateOutfitterStatus below this)
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