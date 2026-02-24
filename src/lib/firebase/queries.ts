
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy
} from 'firebase/firestore';
import { adminDb } from './admin';
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
    const huntsRef = collection(adminDb, 'hunts').withConverter(huntConverter);
    
    // Base query only fetching verified hunts
    const queryConstraints = [
        where('isVerified', '==', true),
        orderBy('createdAt', 'desc'),
    ];

    if (provinces.length > 0) {
      // Firestore 'in' queries are limited to 30 items.
      queryConstraints.push(where('province', 'in', provinces.slice(0, 30)));
    }
    
    const q = query(huntsRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    let hunts = querySnapshot.docs.map(doc => doc.data());

    // Client-side filter for species, since Firestore doesn't support 'array-contains-any' efficiently for this scale.
    // This is a common and acceptable pattern for secondary filtering.
    if (species.length > 0) {
      hunts = hunts.filter(hunt => 
        hunt.species.some(s => species.includes(s))
      );
    }
    
    return hunts.slice(0, limitCount);

  } catch (error) {
    console.error("Error fetching hunts:", error);
    // In a real app, you might want to log this to a monitoring service.
    return [];
  }
}
