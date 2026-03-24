"use server";

import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";

export async function getOutfitters() {
  try {
    const snap = await adminDb.collection("outfitters").orderBy("createdAt", "desc").get();
    const outfitters = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: outfitters };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateOutfitterStatus(id: string, status: string, rejectionReason?: string) {
  try {
    const updateData: any = { status, updatedAt: new Date().toISOString() };
    if (rejectionReason) updateData.rejectionReason = rejectionReason;
    
    await adminDb.collection("outfitters").doc(id).update(updateData);
    revalidatePath("/dashboard/outfitters");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createOutfitter(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const permitUrl = formData.get("permitUrl") as string;

    // 1. Create Firebase Auth User
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Create Firestore Document linked to Auth UID
    await adminDb.collection("outfitters").doc(userRecord.uid).set({
      name,
      email,
      permitUrl,
      status: "PENDING",
      totalListings: 0,
      createdAt: new Date().toISOString(),
    });

    revalidatePath("/dashboard/outfitters");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAdminAccount(id: string) {
  try {
    // 1. Delete from Firebase Auth
    await adminAuth.deleteUser(id).catch(() => console.log("User not in auth"));
    // 2. Delete from Firestore
    await adminDb.collection("outfitters").doc(id).delete();
    
    revalidatePath("/dashboard/outfitters");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}