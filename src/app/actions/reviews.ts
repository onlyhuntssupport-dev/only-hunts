'use server';

import { adminDb } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';

interface MilestoneData {
  inquiryId: string;
  outfitterId: string;
  hunterId: string;
  milestoneNumber: 1 | 2 | 3;
  ratings: Record<string, number>; // e.g., { communication: 5, friendliness: 4 }
  comment: string;
}

export async function submitMilestoneReview(data: MilestoneData) {
  try {
    const { inquiryId, outfitterId, hunterId, milestoneNumber, ratings, comment } = data;
    
    // We bind the review directly to the Inquiry ID so a hunter can't review a hunt they didn't book
    const reviewRef = adminDb.collection('reviews').doc(inquiryId);
    const reviewDoc = await reviewRef.get();

    let reviewPayload: any = reviewDoc.exists ? reviewDoc.data() : {
      inquiryId,
      outfitterId,
      hunterId,
      createdAt: new Date().toISOString(),
      milestone1: null,
      milestone2: null,
      milestone3: null,
      averageScore: 0,
    };

    // 1. Inject the specific milestone data
    const milestoneKey = `milestone${milestoneNumber}`;
    reviewPayload[milestoneKey] = {
      ratings,
      comment,
      completedAt: new Date().toISOString()
    };

    // 2. The Master Calculator: Find the overall average across all completed milestones
    let totalScore = 0;
    let totalRatings = 0;

    [1, 2, 3].forEach(m => {
      const mData = reviewPayload[`milestone${m}`];
      if (mData && mData.ratings) {
        Object.values(mData.ratings).forEach((score: any) => {
          totalScore += Number(score);
          totalRatings += 1;
        });
      }
    });

    // Round to 1 decimal place (e.g., 4.7)
    reviewPayload.averageScore = totalRatings > 0 ? Number((totalScore / totalRatings).toFixed(1)) : 0;
    reviewPayload.updatedAt = new Date().toISOString();

    // 3. Save to the database
    await reviewRef.set(reviewPayload, { merge: true });

    // 4. Update the Outfitter's global profile rating so the marketplace sees it instantly
    await updateOutfitterGlobalRating(outfitterId);

    revalidatePath('/hunter/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error("Error submitting milestone review:", error);
    return { success: false, error: error.message };
  }
}

// --- INTERNAL HELPER: Calculates the Outfitter's Global Score across ALL their booked hunts ---
async function updateOutfitterGlobalRating(outfitterId: string) {
  try {
    const reviewsSnapshot = await adminDb.collection('reviews')
      .where('outfitterId', '==', outfitterId)
      .get();

    if (reviewsSnapshot.empty) return;

    let globalTotal = 0;
    let validReviewsCount = 0;

    reviewsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.averageScore > 0) {
        globalTotal += data.averageScore;
        validReviewsCount += 1;
      }
    });

    const globalAverage = validReviewsCount > 0 ? Number((globalTotal / validReviewsCount).toFixed(1)) : 0;

    // Save it directly to the Outfitter's user profile
    await adminDb.collection('users').doc(outfitterId).update({
      platformRating: globalAverage,
      reviewCount: validReviewsCount
    });

  } catch (error) {
    console.error("Error updating outfitter global rating:", error);
  }
}