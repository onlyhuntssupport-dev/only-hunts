import { doc, setDoc, increment, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
// OVERRIDE: Updated import to securely use the existing Firebase instance
import { db } from './client'; 

// Helper to format date as YYYY-MM-DD
const getTodayDateString = () => {
  const today = new Date();
  // Adjust to local time if needed, but ISO is standard for daily aggregation
  return today.toISOString().split('T')[0];
};

export const incrementDailyView = async () => {
  try {
    const dateStr = getTodayDateString();
    const docRef = doc(db, 'analytics', dateStr);
    
    // setDoc with merge: true ensures we create the document if it's the first hit of the day,
    // or increments the existing counter if the document already exists.
    await setDoc(docRef, {
      views: increment(1),
      date: dateStr, 
      lastUpdated: new Date()
    }, { merge: true });
  } catch (error) {
    console.error("Firebase Analytics Error - Increment:", error);
  }
};

export const getRecentTraffic = async (days = 7) => {
  try {
    const q = query(
      collection(db, 'analytics'),
      orderBy('date', 'desc'),
      limit(days)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Firebase Analytics Error - Fetch:", error);
    return [];
  }
};