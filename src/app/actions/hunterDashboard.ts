"use server";

import { adminDb } from "@/lib/firebase/admin";

export async function fetchHunterDashboardData(uid: string) {
  try {
    // 1. Fetch User Profile
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const hunterName = userData?.name || "Hunter";
    const profileImage = userData?.profileImageUrl || "";

    // 2. Fetch Pending Quotes Count (Targeting 'Action Required' states)
    const quotesSnap = await adminDb.collection("quote_requests")
      .where("hunterId", "==", uid)
      .where("status", "in", ["QUOTE_PROVIDED", "PENDING_HUNTER_ACCEPTANCE"])
      .get();
    const pendingQuotesCount = quotesSnap.size;

    // 3. Fetch Wishlist Count
    const wishlistSnap = await adminDb.collection("wishlists").doc(uid).get();
    const wishlistCount = wishlistSnap.exists ? (wishlistSnap.data()?.huntIds || []).length : 0;

    // 4. Fetch Reviews
    const reviewsSnap = await adminDb.collection("reviews").where("hunterId", "==", uid).get();
    const reviewStatuses: Record<string, any> = {};
    reviewsSnap.docs.forEach(doc => { reviewStatuses[doc.id] = doc.data(); });

    // 5. Fetch Inquiries (Filtered for non-archived)
    const inquiriesSnap = await adminDb.collection("inquiries").where("hunterId", "==", uid).get();
    const inquiries = inquiriesSnap.docs
      .map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data, 
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString() 
        };
      })
      .filter((i: any) => !i.hunterArchived);

    // 6. Fetch Offers (Filtered for active)
    const offersSnap = await adminDb.collection("offers").where("hunterId", "==", uid).get();
    const offers = offersSnap.docs
      .map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data, 
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString() 
        };
      })
      .filter((o: any) => o.status !== "DISMISSED");

    // 7. Batch Fetch Outfitter Details
    const outfitterIds = [...new Set([
      ...inquiries.map((i: any) => i.outfitterId), 
      ...offers.map((o: any) => o.outfitterId)
    ])].filter(Boolean);
    
    const outfitterData: Record<string, {name: string, logo: string}> = {};

    if (outfitterIds.length > 0) {
      // Fetching outfitter metadata in parallel
      await Promise.all(outfitterIds.map(async (id) => {
        const oDoc = await adminDb.collection("users").doc(id).get();
        if (oDoc.exists) {
          const oData = oDoc.data();
          outfitterData[id] = {
            name: oData?.companyName || oData?.name || "Verified Outfitter",
            logo: oData?.profileImageUrl || ""
          };
        }
      }));
    }

    // 8. Final Enrichment and Sorting
    const enrichedInquiries = inquiries.map((i: any) => ({
      ...i,
      outfitterName: outfitterData[i.outfitterId]?.name || "Verified Outfitter",
      outfitterLogo: outfitterData[i.outfitterId]?.logo || ""
    })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const enrichedOffers = offers.map((o: any) => ({
      ...o,
      outfitterName: outfitterData[o.outfitterId]?.name || "Verified Outfitter",
      outfitterLogo: outfitterData[o.outfitterId]?.logo || ""
    })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      hunterName,
      profileImage,
      pendingQuotesCount,
      wishlistCount,
      reviewStatuses,
      inquiries: enrichedInquiries,
      offers: enrichedOffers
    };

  } catch (error) {
    console.error("Critical error in dashboard server action:", error);
    throw new Error("Unable to retrieve dashboard information.");
  }
}