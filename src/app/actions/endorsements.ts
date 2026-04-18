"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";

// Utility to prevent Next.js Client Component crash from Firestore Timestamps
function serializeFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'object' && typeof obj.toDate === 'function') return obj.toDate().toISOString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(item => serializeFirestoreData(item));
  if (typeof obj === 'object') {
    const serialized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeFirestoreData(value);
    }
    return serialized;
  }
  return obj;
}

export async function getEndorsements() {
  try {
    const snapshot = await adminDb.collection("endorsements").orderBy("order", "asc").get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: serializeFirestoreData(data) };
  } catch (error: any) {
    console.error("Error fetching endorsements:", error);
    return { success: false, error: "Failed to fetch brand partners." };
  }
}

export async function createEndorsement(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const logoUrl = formData.get("logoUrl") as string;
    
    // FIXED: Only enforce the name field. Logo is now fully optional on the backend.
    if (!name) {
      return { success: false, error: "Brand Name is required." };
    }

    const newDoc = {
      name,
      logoUrl: logoUrl || "",
      websiteUrl: formData.get("websiteUrl") as string || "",
      type: formData.get("type") as string || "PARTNER",
      isActive: true,
      order: Number(formData.get("order")) || 0,
      createdAt: new Date().toISOString()
    };

    await adminDb.collection("endorsements").add(newDoc);
    
    revalidatePath("/admin/endorsements");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating endorsement:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteEndorsement(id: string) {
  try {
    await adminDb.collection("endorsements").doc(id).delete();
    revalidatePath("/admin/endorsements");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting endorsement:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleEndorsementStatus(id: string, currentStatus: boolean) {
  try {
    await adminDb.collection("endorsements").doc(id).update({ isActive: !currentStatus });
    revalidatePath("/admin/endorsements");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating status:", error);
    return { success: false, error: error.message };
  }
}