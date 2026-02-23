import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { Hunt, HuntSchema } from '../../validations/hunt';

export const huntConverter: FirestoreDataConverter<Hunt> = {
  toFirestore: (hunt) => hunt,
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    // Validate the data from Firestore against our Zod schema
    return HuntSchema.parse({
      ...data,
      id: snapshot.id,
    });
  },
};