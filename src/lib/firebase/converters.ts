
import { FirestoreDataConverter, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';
import { Hunt, HuntSchema } from '../validations/hunt';

export const huntConverter: FirestoreDataConverter<Hunt> = {
  toFirestore: (hunt: Hunt) => {
    // If createdAt is a Date object, convert it to a Firestore Timestamp
    if (hunt.createdAt instanceof Date) {
      return { ...hunt, createdAt: Timestamp.fromDate(hunt.createdAt) };
    }
    return hunt;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): Hunt => {
    const data = snapshot.data();
    
    // Convert Firestore Timestamp to JS Date object
    const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate().toISOString() 
        : data.createdAt;

    // Use Zod to parse and validate the data
    const parsed = HuntSchema.safeParse({ 
        ...data, 
        id: snapshot.id,
        createdAt: createdAt
    });

    if (!parsed.success) {
        console.error(`Invalid hunt data for ID ${snapshot.id}:`, parsed.error.flatten().fieldErrors);
        // This could be replaced with a more robust error handling, 
        // but for now, we throw to make it visible during development.
        throw new Error(`Failed to parse hunt data for ID ${snapshot.id}`);
    }

    return parsed.data;
  },
};
