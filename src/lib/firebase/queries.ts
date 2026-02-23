import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
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
  limitCount = 12 
}: FetchHuntsParams): Promise<Hunt[]> {
  try {
    const { firestore: db } = initializeFirebase();
    const huntsRef = collection(db, 'hunts').withConverter(huntConverter);
    
    // Firestore queries are limited. We can't use 'in' and 'array-contains-any' on different fields.
    // We'll query by province first (if present), then filter by species in memory.
    let q = query(huntsRef, orderBy('createdAt', 'desc'));

    if (provinces.length > 0) {
      q = query(q, where('province', 'in', provinces));
    }

    const querySnapshot = await getDocs(q);
    let hunts = querySnapshot.docs.map(doc => doc.data());

    if (species.length > 0) {
      hunts = hunts.filter(hunt => 
        hunt.species.some(s => species.includes(s))
      );
    }
    
    return hunts.slice(0, limitCount);

  } catch (error) {
    console.error("Error fetching hunts:", error);
    // In a production app, you'd want more robust error handling.
    // For now, return an empty array to prevent the page from crashing.
    return [];
  }
}
