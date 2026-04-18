"use server";

import { revalidatePath } from "next/cache";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { sendPlatformEmail } from "@/lib/email/sender";

// ============================================================================
// UTILITY: FIRESTORE SERIALIZER (Prevents Next.js Boundary Crash)
// ============================================================================
function serializeFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'object' && typeof obj.toDate === 'function') {
    return obj.toDate().toISOString();
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeFirestoreData(item));
  }

  if (typeof obj === 'object') {
    const serialized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeFirestoreData(value);
    }
    return serialized;
  }

  return obj;
}

// ============================================================================
// 1. ADMIN MANAGEMENT ACTIONS 
// ============================================================================

export async function createAdmin(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;

    if (!email || !password || !role) {
      return { success: false, error: "Missing required fields." };
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

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
    return { success: false, error: error.message || "Failed to create admin." };
  }
}

export async function deleteAdmin(adminId: string) {
  try {
    await adminDb.collection("users").doc(adminId).delete();
    try {
      if (adminAuth) await adminAuth.deleteUser(adminId);
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

export async function getAdmins() {
  try {
    const usersRef = adminDb.collection("users");
    const snapshot = await usersRef.where("role", "in", ["ADMIN", "SUPER_ADMIN", "SUPERADMIN"]).get();
    
    const entities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: serializeFirestoreData(entities) };
  } catch (err: any) {
    console.error("Admin fetch error:", err);
    return { success: false, error: "Failed to fetch admin team." };
  }
}

// ============================================================================
// 2. PLATFORM APPROVAL, VERIFICATION & SUSPENSION ACTIONS 
// ============================================================================

export async function approveOutfitter(uid: string) {
  try {
    const outfitterDoc = await adminDb.collection('outfitters').doc(uid).get();
    if (!outfitterDoc.exists) throw new Error('Outfitter not found');
    const outfitterData = outfitterDoc.data();

    const trialExpirationDate = new Date();
    trialExpirationDate.setDate(trialExpirationDate.getDate() + 14);

    const timestamp = new Date().toISOString();

    await adminDb.collection('outfitters').doc(uid).update({
      status: 'ACTIVE',
      tier: 'free_trial',
      subscriptionEndsAt: trialExpirationDate, 
      updatedAt: timestamp,
    });

    await adminDb.collection('users').doc(uid).update({
      status: 'ACTIVE',
      tier: 'free_trial',
      updatedAt: timestamp,
    });

    if (outfitterData?.email) {
      await sendPlatformEmail({
        to: outfitterData.email,
        subject: 'Welcome to Only-Hunts! Your 14-Day Trial is Active.',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Your Outfitter Account is Approved</h2>
            <p>Hi ${outfitterData.name || 'Partner'},</p>
            <p>Our admin team has successfully verified your professional credentials.</p>
            <p><strong>Your 14-Day Free Trial begins today.</strong></p>
            <p>Log in now to your dashboard to build your profile and publish your first safari packages to the marketplace.</p>
            <br/>
            <a href="https://only-hunts.com/login" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
          </div>
        `
      });
    }

    revalidatePath("/admin/approvals");
    revalidatePath("/admin/outfitters");
    return { success: true };
  } catch (error: any) {
    console.error(`Error approving outfitter ${uid}:`, error);
    return { success: false, error: error.message };
  }
}

export async function verifyOutfitter(outfitterId: string) {
  try {
    const timestamp = new Date().toISOString();
    
    await adminDb.collection("users").doc(outfitterId).update({
      status: "VERIFIED", 
      isVerified: true,
      updatedAt: timestamp
    });
    
    await adminDb.collection("outfitters").doc(outfitterId).update({
      status: "VERIFIED", 
      isVerified: true,
      updatedAt: timestamp
    }).catch(() => {}); 

    revalidatePath("/admin");
    revalidatePath("/admin/outfitters");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectOutfitter(outfitterId: string) {
  try {
    const timestamp = new Date().toISOString();
    await adminDb.collection("users").doc(outfitterId).update({
      status: "REJECTED",
      isVerified: false,
      updatedAt: timestamp
    });
    await adminDb.collection("outfitters").doc(outfitterId).update({
      status: "REJECTED",
      isVerified: false,
      updatedAt: timestamp
    }).catch(() => {});

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function suspendUser(userId: string) {
  try {
    const timestamp = new Date().toISOString();
    await adminDb.collection("users").doc(userId).update({
      status: "SUSPENDED",
      updatedAt: timestamp
    });
    await adminDb.collection("outfitters").doc(userId).update({
      status: "SUSPENDED",
      updatedAt: timestamp
    }).catch(() => {});

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reinstateUser(userId: string) {
  try {
    const timestamp = new Date().toISOString();
    await adminDb.collection("users").doc(userId).update({
      status: "VERIFIED", 
      updatedAt: timestamp
    });
    await adminDb.collection("outfitters").doc(userId).update({
      status: "VERIFIED", 
      updatedAt: timestamp
    }).catch(() => {});

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveHuntListing(huntId: string) {
  try {
    await adminDb.collection("hunts").doc(huntId).update({
      status: "APPROVED",
      updatedAt: new Date().toISOString()
    });
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectHuntListing(huntId: string, reason?: string) {
  try {
    await adminDb.collection("hunts").doc(huntId).update({
      status: "REJECTED",
      rejectionReason: reason || "Did not meet platform guidelines.",
      updatedAt: new Date().toISOString()
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// 3. COMMAND CENTER DATA FETCHERS 
// ============================================================================

export async function getAdminMarketplaceStats() {
  try {
    const quotesRef = adminDb.collection("quote_requests");
    const snapshot = await quotesRef.get();
    
    let totalGmv = 0;
    let pendingRequests = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === "ACCEPTED") {
        totalGmv += (data.totalAmount || 0);
      }
      if (data.status === "PENDING_OUTFITTER_REVIEW") {
        pendingRequests++;
      }
    });

    return { 
      success: true, 
      stats: { totalGmv, pendingRequests, totalQuotes: snapshot.size } 
    };
  } catch (err: any) {
    console.error("Stats error:", err);
    return { success: false, error: "Failed to fetch stats" };
  }
}

export async function getGlobalEntities(type: "outfitter" | "hunter") {
  try {
    let snapshot;
    
    if (type === "outfitter") {
      snapshot = await adminDb.collection("outfitters").get();
    } else {
      snapshot = await adminDb.collection("users").where("role", "==", "HUNTER").get();
    }
    
    const entities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: serializeFirestoreData(entities) };
  } catch (err: any) {
    console.error("Entity fetch error:", err);
    return { success: false, error: "Failed to fetch entities" };
  }
}

// ============================================================================
// 4. READ-ONLY DATA INSPECTOR
// ============================================================================

export async function getEntityActivity(userId: string, role: string) {
  try {
    let activity = {};
    
    if (role === "OUTFITTER") {
      const huntsSnap = await adminDb.collection("hunts").where("outfitterId", "==", userId).get();
      const leadsSnap = await adminDb.collection("quote_requests").where("outfitterId", "==", userId).get();
      
      activity = {
        activePackages: huntsSnap.size,
        totalLeads: leadsSnap.size,
        recentPackages: huntsSnap.docs.map(d => ({ id: d.id, title: d.data().title, status: d.data().status })).slice(0, 5)
      };
    } else {
      const requestsSnap = await adminDb.collection("quote_requests").where("hunterId", "==", userId).get();
      
      activity = {
        requestedQuotes: requestsSnap.size,
        recentQuotes: requestsSnap.docs.map(d => ({ id: d.id, target: d.data().targetSpecies, status: d.data().status })).slice(0, 5)
      };
    }

    return { success: true, data: serializeFirestoreData(activity) };
  } catch (error: any) {
    console.error("Activity fetch error:", error);
    return { success: false, error: "Failed to fetch entity activity." };
  }
}

// ============================================================================
// 5. ACCOUNTING & LEDGER MODULE (NEW)
// ============================================================================

export async function getFinancialLedger() {
  try {
    const txRef = adminDb.collection("transactions");
    const snapshot = await txRef.orderBy("createdAt", "desc").limit(200).get();

    let mrr = 0;
    let totalRevenue = 0;
    let activeSubs = 0;

    const transactions = snapshot.docs.map(doc => {
      const data = doc.data();
      if (data.status === "PAID" || data.status === "SUCCESS") {
        totalRevenue += (data.amount || 0);
        if (data.type === "SUBSCRIPTION") {
          mrr += (data.amount || 0);
          activeSubs++;
        }
      }
      return { id: doc.id, ...data };
    });

    return { 
      success: true, 
      data: serializeFirestoreData(transactions),
      stats: { mrr, totalRevenue, activeSubs }
    };
  } catch (err: any) {
    console.error("Ledger fetch error:", err);
    return { success: false, error: "Failed to fetch financial ledger." };
  }
}

// ============================================================================
// 6. THE NUKE COMMANDS (Permanent Deletion)
// ============================================================================

export async function nukeOutfitter(uid: string) {
  try {
    try {
      await adminAuth.deleteUser(uid);
    } catch (authError: any) {
      console.warn(`Auth user ${uid} not found. Proceeding to database wipe...`);
    }

    await adminDb.collection("outfitters").doc(uid).delete();
    await adminDb.collection("users").doc(uid).delete();

    revalidatePath("/admin/outfitters");
    revalidatePath("/admin");
    
    return { success: true };
  } catch (error: any) {
    console.error(`CRITICAL: Error nuking outfitter ${uid}:`, error);
    return { success: false, error: error.message };
  }
}

export async function deleteHunter(uid: string) {
  try {
    // 1. Delete from Firebase Auth
    try {
      await adminAuth.deleteUser(uid);
    } catch (authError: any) {
      console.warn(`Auth user ${uid} not found. Proceeding to database wipe...`);
    }

    // 2. Delete from Firestore Users Collection
    await adminDb.collection("users").doc(uid).delete();

    // 3. Refresh the Admin UI
    revalidatePath("/admin/hunters"); 
    revalidatePath("/admin");
    
    return { success: true };
  } catch (error: any) {
    console.error(`CRITICAL: Error deleting hunter ${uid}:`, error);
    return { success: false, error: error.message };
  }
}