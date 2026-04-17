import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';
// OVERRIDE: Import db from client, not adminDb
import { db } from './client';
import { huntConverter } from './converters';
import { Hunt } from '../validations/hunt';

interface FetchHuntsParams {
  provinces?: string[];
  species?: string[];
  limitCount?: number;
}

/**
 * Fetches hunts from Firestore based on URL search parameters.
 * Uses the huntConverter for automatic Zod validation.
 */
export async function getHunts({ 
  provinces = [], 
  species = [], 
  limitCount = 30
}: FetchHuntsParams): Promise<Hunt[]> {
  try {
    // OVERRIDE: Swapped adminDb to db
    const huntsRef = collection(db, 'hunts').withConverter(huntConverter);
    
    // Base query only fetching verified and active hunts
    const queryConstraints: any[] = [
        where('isVerified', '==', true),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
    ];

    if (provinces.length > 0) {
      // Firestore 'in' queries are limited to 30 items.
      queryConstraints.push(where('province', 'in', provinces.slice(0, 30)));
    }
    
    const q = query(huntsRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    let hunts = querySnapshot.docs.map(doc => doc.data());

    // Client-side filter for species
    if (species.length > 0) {
      hunts = hunts.filter(hunt => 
        hunt.species?.some(s => species.includes(s))
      );
    }
    
    // --- NEW: PREMIUM ALGORITHM ENGINE ---
    // Fetch outfitter profiles to check Premium status and inject it into the hunt data
    const outfitterCache = new Map<string, boolean>();
    
    const enrichedHunts = await Promise.all(hunts.map(async (hunt: any) => {
      let isPremium = false;
      if (hunt.outfitterId) {
        if (outfitterCache.has(hunt.outfitterId)) {
          isPremium = outfitterCache.get(hunt.outfitterId)!;
        } else {
          try {
            const outfitterDoc = await getDoc(doc(db, 'users', hunt.outfitterId));
            if (outfitterDoc.exists()) {
              isPremium = outfitterDoc.data().isPremium === true;
            }
            outfitterCache.set(hunt.outfitterId, isPremium);
          } catch (e) {
            console.error("Failed to fetch outfitter status", e);
            outfitterCache.set(hunt.outfitterId, false);
          }
        }
      }
      return { ...hunt, outfitterIsPremium: isPremium };
    }));

    // Sort: Premium listings first, maintaining chronological order as a secondary sort
    enrichedHunts.sort((a, b) => {
      if (a.outfitterIsPremium && !b.outfitterIsPremium) return -1;
      if (!a.outfitterIsPremium && b.outfitterIsPremium) return 1;
      return 0; 
    });

    return enrichedHunts.slice(0, limitCount) as Hunt[];

  } catch (error) {
    console.error("Error fetching hunts:", error);
    return [];
  }
}