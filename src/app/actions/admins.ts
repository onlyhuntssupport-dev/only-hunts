"use server";

import { revalidatePath } from "next/cache";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { sendPlatformEmail } from "@/lib/email/sender";

// ============================================================================
// UTILITY: FIRESTORE SERIALIZER
// ============================================================================
function serializeFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'object' && typeof obj.toDate === 'function') return obj.toDate().toISOString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(item => serializeFirestoreData(item));
  if (typeof obj === 'object') {
    const serialized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) serialized[key] = serializeFirestoreData(value);
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
    const performedBy = formData.get("performedBy") as string || "System";

    if (!email || !password || !role) return { success: false, error: "Missing required fields." };

    const userRecord = await adminAuth.createUser({ email, password, displayName: name });

    await adminDb.collection("users").doc(userRecord.uid).set({
      name, email, role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await logAdminAction("CREATE_ADMIN", userRecord.uid, performedBy, { createdEmail: email, assignedRole: role });

    revalidatePath("/dashboard/admins");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating admin:", error);
    return { success: false, error: error.message || "Failed to create admin." };
  }
}

export async function deleteAdmin(adminId: string, performedBy: string) {
  try {
    await adminDb.collection("users").doc(adminId).delete();
    try { if (adminAuth) await adminAuth.deleteUser(adminId); } catch (authError: any) {}
    
    await logAdminAction("DELETE_ADMIN", adminId, performedBy, { action: "PERMANENT_DELETION" });

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
    const entities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: serializeFirestoreData(entities) };
  } catch (err: any) {
    console.error("Admin fetch error:", err);
    return { success: false, error: "Failed to fetch admin team." };
  }
}

export async function updateAdminRole(targetUid: string, newRole: string, performedBy: string) {
  try {
    const validRoles = ["ADMIN", "SUPER_ADMIN", "SUPERADMIN", "REVOKED"];
    if (!validRoles.includes(newRole)) return { success: false, error: "Invalid role specified." };

    const userDoc = await adminDb.collection("users").doc(targetUid).get();
    const previousRole = userDoc.exists ? userDoc.data()?.role : "UNKNOWN";

    await adminAuth.setCustomUserClaims(targetUid, { role: newRole });
    await adminDb.collection("users").doc(targetUid).update({
      role: newRole, isActive: newRole !== "REVOKED",
      updatedAt: new Date().toISOString(), forceRefresh: true
    });

    await logAdminAction("ROLE_UPDATE", targetUid, performedBy, { previousRole, newRole });

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating admin role:", error);
    return { success: false, error: error.message || "Failed to update security permissions." };
  }
}

// ============================================================================
// 2. PLATFORM APPROVAL, VERIFICATION & SUSPENSION ACTIONS 
// ============================================================================

export async function approveOutfitter(uid: string, performedBy: string) {
  try {
    const outfitterDoc = await adminDb.collection('outfitters').doc(uid).get();
    if (!outfitterDoc.exists) throw new Error('Outfitter not found');
    const outfitterData = outfitterDoc.data();

    const trialExpirationDate = new Date();
    trialExpirationDate.setDate(trialExpirationDate.getDate() + 14);
    const timestamp = new Date().toISOString();

    await adminDb.collection('outfitters').doc(uid).update({
      status: 'ACTIVE', tier: 'free_trial', subscriptionEndsAt: trialExpirationDate, updatedAt: timestamp,
    });
    await adminDb.collection('users').doc(uid).update({
      status: 'ACTIVE', tier: 'free_trial', updatedAt: timestamp,
    });

    await logAdminAction("APPROVE_OUTFITTER", uid, performedBy, { newStatus: "ACTIVE", tier: "free_trial" });

    if (outfitterData?.email) {
      await sendPlatformEmail({
        to: outfitterData.email,
        subject: 'Welcome to Only-Hunts! Your 14-Day Trial is Active.',
        html: `<h2>Your Outfitter Account is Approved</h2>`
      });
    }

    revalidatePath("/admin/approvals");
    revalidatePath("/admin/outfitters");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function verifyOutfitter(outfitterId: string, performedBy: string) {
  try {
    const timestamp = new Date().toISOString();
    await adminDb.collection("users").doc(outfitterId).update({ status: "VERIFIED", isVerified: true, updatedAt: timestamp });
    await adminDb.collection("outfitters").doc(outfitterId).update({ status: "VERIFIED", isVerified: true, updatedAt: timestamp }).catch(() => {}); 
    
    await logAdminAction("VERIFY_OUTFITTER", outfitterId, performedBy, { newStatus: "VERIFIED" });

    revalidatePath("/admin/outfitters");
    revalidatePath(`/admin/outfitters/${outfitterId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectOutfitter(outfitterId: string, performedBy: string) {
  try {
    const timestamp = new Date().toISOString();
    await adminDb.collection("users").doc(outfitterId).update({ status: "REJECTED", isVerified: false, updatedAt: timestamp });
    await adminDb.collection("outfitters").doc(outfitterId).update({ status: "REJECTED", isVerified: false, updatedAt: timestamp }).catch(() => {});
    
    await logAdminAction("REJECT_OUTFITTER", outfitterId, performedBy, { newStatus: "REJECTED" });

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function suspendUser(userId: string, performedBy: string) {
  try {
    const timestamp = new Date().toISOString();
    await adminDb.collection("users").doc(userId).update({ status: "SUSPENDED", updatedAt: timestamp });
    await adminDb.collection("outfitters").doc(userId).update({ status: "SUSPENDED", updatedAt: timestamp }).catch(() => {});

    await logAdminAction("SUSPEND_USER", userId, performedBy, { newStatus: "SUSPENDED" });

    revalidatePath("/admin/outfitters");
    revalidatePath(`/admin/outfitters/${userId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reinstateUser(userId: string, performedBy: string) {
  try {
    const timestamp = new Date().toISOString();
    await adminDb.collection("users").doc(userId).update({ status: "VERIFIED", updatedAt: timestamp });
    await adminDb.collection("outfitters").doc(userId).update({ status: "VERIFIED", updatedAt: timestamp }).catch(() => {});

    await logAdminAction("REINSTATE_USER", userId, performedBy, { newStatus: "VERIFIED" });

    revalidatePath("/admin/outfitters");
    revalidatePath(`/admin/outfitters/${userId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveHuntListing(huntId: string, performedBy: string) {
  try {
    await adminDb.collection("hunts").doc(huntId).update({ status: "APPROVED", updatedAt: new Date().toISOString() });
    
    await logAdminAction("APPROVE_HUNT", huntId, performedBy, { newStatus: "APPROVED" });

    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectHuntListing(huntId: string, reason: string | undefined, performedBy: string) {
  try {
    const rejectionReason = reason || "Did not meet platform guidelines.";
    await adminDb.collection("hunts").doc(huntId).update({ status: "REJECTED", rejectionReason, updatedAt: new Date().toISOString() });
    
    await logAdminAction("REJECT_HUNT", huntId, performedBy, { reason: rejectionReason });

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
    let totalGmv = 0; let pendingRequests = 0;
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === "ACCEPTED") totalGmv += (data.totalAmount || 0);
      if (data.status === "PENDING_OUTFITTER_REVIEW") pendingRequests++;
    });
    return { success: true, stats: { totalGmv, pendingRequests, totalQuotes: snapshot.size } };
  } catch (err: any) {
    return { success: false, error: "Failed to fetch stats" };
  }
}

export async function getGlobalEntities(type: "outfitter" | "hunter") {
  try {
    let snapshot;
    if (type === "outfitter") snapshot = await adminDb.collection("outfitters").get();
    else snapshot = await adminDb.collection("users").where("role", "==", "HUNTER").get();
    const entities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: serializeFirestoreData(entities) };
  } catch (err: any) {
    return { success: false, error: "Failed to fetch entities" };
  }
}

// NEW: Fetch a single outfitter for the dedicated detail page
export async function getOutfitterById(id: string) {
  try {
    const docSnap = await adminDb.collection("outfitters").doc(id).get();
    if (!docSnap.exists) {
      return { success: false, error: "Outfitter not found" };
    }
    return { success: true, data: serializeFirestoreData({ id: docSnap.id, ...docSnap.data() }) };
  } catch (error: any) {
    console.error("Error fetching single outfitter:", error);
    return { success: false, error: "Failed to load outfitter details" };
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
      activity = { activePackages: huntsSnap.size, totalLeads: leadsSnap.size, recentPackages: huntsSnap.docs.map(d => ({ id: d.id, title: d.data().title, status: d.data().status })).slice(0, 5) };
    } else {
      const requestsSnap = await adminDb.collection("quote_requests").where("hunterId", "==", userId).get();
      activity = { requestedQuotes: requestsSnap.size, recentQuotes: requestsSnap.docs.map(d => ({ id: d.id, target: d.data().targetSpecies, status: d.data().status })).slice(0, 5) };
    }
    return { success: true, data: serializeFirestoreData(activity) };
  } catch (error: any) {
    return { success: false, error: "Failed to fetch entity activity." };
  }
}

// ============================================================================
// 5. ACCOUNTING & LEDGER MODULE
// ============================================================================

export async function getFinancialLedger() {
  try {
    const txRef = adminDb.collection("transactions");
    const snapshot = await txRef.orderBy("createdAt", "desc").limit(200).get();
    let mrr = 0; let totalRevenue = 0; let activeSubs = 0;
    const transactions = snapshot.docs.map(doc => {
      const data = doc.data();
      if (data.status === "PAID" || data.status === "SUCCESS") {
        totalRevenue += (data.amount || 0);
        if (data.type === "SUBSCRIPTION") { mrr += (data.amount || 0); activeSubs++; }
      }
      return { id: doc.id, ...data };
    });
    return { success: true, data: serializeFirestoreData(transactions), stats: { mrr, totalRevenue, activeSubs } };
  } catch (err: any) {
    return { success: false, error: "Failed to fetch financial ledger." };
  }
}

// ============================================================================
// 6. THE NUKE COMMANDS (Permanent Deletion)
// ============================================================================

export async function nukeOutfitter(uid: string, performedBy: string) {
  try {
    try { await adminAuth.deleteUser(uid); } catch (authError: any) {}
    await adminDb.collection("outfitters").doc(uid).delete();
    await adminDb.collection("users").doc(uid).delete();

    await logAdminAction("NUKE_OUTFITTER", uid, performedBy, { action: "PERMANENT_DELETION" });

    revalidatePath("/admin/outfitters");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteHunter(uid: string, performedBy: string) {
  try {
    // 1. Delete from Firebase Auth
    try { await adminAuth.deleteUser(uid); } catch (authError: any) {}
    // 2. Delete from Firestore
    await adminDb.collection("users").doc(uid).delete();

    await logAdminAction("DELETE_HUNTER", uid, performedBy, { action: "PERMANENT_DELETION" });

    revalidatePath("/admin/hunters"); 
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// 7. SECURITY & AUDIT LOGS
// ============================================================================

export async function logAdminAction(action: string, targetUid: string, performedBy: string, metadata: any = {}) {
  try {
    await adminDb.collection("audit_logs").add({
      action, targetUid, performedBy, ...metadata, timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

export async function getAuditLogs(limitCount = 200) {
  try {
    const snapshot = await adminDb.collection("audit_logs").orderBy("timestamp", "desc").limit(limitCount).get();
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: serializeFirestoreData(logs) };
  } catch (err: any) {
    return { success: false, error: "Failed to fetch audit logs." };
  }
}

// ============================================================================
// 8. OUTFITTER FINANCIAL & TIER OVERRIDES
// ============================================================================

export async function updateOutfitterFinancials(outfitterId: string, payload: any, performedBy: string = "System Admin") {
  try {
    const updateData = {
      tier: payload.tier || "standard",
      promoCommissionRate: payload.promoCommissionRate ?? null,
      promoSubscriptionRate: payload.promoSubscriptionRate ?? null,
      promoExpiresAt: payload.promoExpiresAt ?? null,
      updatedAt: new Date().toISOString()
    };

    await adminDb.collection("outfitters").doc(outfitterId).update(updateData);
    
    await adminDb.collection("users").doc(outfitterId).update({
      tier: updateData.tier,
      promoCommissionRate: updateData.promoCommissionRate,
      promoSubscriptionRate: updateData.promoSubscriptionRate,
      promoExpiresAt: updateData.promoExpiresAt,
      updatedAt: updateData.updatedAt
    });

    await logAdminAction("OVERRIDE_FINANCIALS", outfitterId, performedBy, {
      tier: updateData.tier,
      commission: updateData.promoCommissionRate,
      subscription: updateData.promoSubscriptionRate,
      expires: updateData.promoExpiresAt
    });

    revalidatePath("/admin/outfitters");
    revalidatePath(`/admin/outfitters/${outfitterId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating outfitter financials:", error);
    return { success: false, error: error.message };
  }
}