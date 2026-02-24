
import { FirestoreDataConverter, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';
import { Hunt, HuntSchema } from '../validations/hunt';

export const huntConverter: FirestoreDataConverter<Hunt> = {
  toFirestore: (hunt: Hunt) => {
    const data: any = { ...hunt };
    
    // Convert Date objects to Firestore Timestamps before sending
    if (data.createdAt instanceof Date) {
      data.createdAt = Timestamp.fromDate(data.createdAt);
    }
    if (data.approvedAt instanceof Date) {
        data.approvedAt = Timestamp.fromDate(data.approvedAt);
    }
    return data;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): Hunt => {
    const data = snapshot.data();
    
    // Convert Firestore Timestamps to JS Date objects
    const convertedData = { ...data };
    for (const key of ['createdAt', 'approvedAt']) {
        if (data[key] instanceof Timestamp) {
            convertedData[key] = data[key].toDate();
        }
    }

    // Use Zod to parse and validate the data
    const parsed = HuntSchema.safeParse({ 
        ...convertedData, 
        id: snapshot.id,
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
