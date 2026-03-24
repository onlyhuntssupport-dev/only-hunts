'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface Hunt {
  id: string;
  title: string;
  price: number;
  location?: string;
}

export default function MoreFromOutfitter({ 
  outfitterId, 
  currentHuntId, 
  outfitterName = "this Outfitter" 
}: { 
  outfitterId: string; 
  currentHuntId: string;
  outfitterName?: string;
}) {
  const [otherHunts, setOtherHunts] = useState<Hunt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOtherHunts = async () => {
      if (!outfitterId) return;
      
      try {
        const huntsRef = collection(db, 'hunts');
        // Fetch up to 4 hunts from this specific outfitter
        const q = query(huntsRef, where('outfitterId', '==', outfitterId), limit(4));
        const snapshot = await getDocs(q);
        
        const results = snapshot.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as Omit<Hunt, 'id'>) }))
          // Filter out the hunt we are currently looking at
          .filter(hunt => hunt.id !== currentHuntId)
          // Keep only the first 3 to make a nice grid
          .slice(0, 3);
          
        setOtherHunts(results);
      } catch (error) {
        console.error("Error fetching other hunts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOtherHunts();
  }, [outfitterId, currentHuntId]);

  if (loading || otherHunts.length === 0) return null;

  return (
    <div className="mt-16 pt-8 border-t-2 border-kalahari/20">
      <h3 className="text-2xl font-bold text-olive dark:text-off-white mb-6 font-headline">
        More Offerings from {outfitterName}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {otherHunts.map((hunt) => (
          <Link 
            key={hunt.id} 
            href={`/hunts/${hunt.id}`}
            className="group block border-2 border-kalahari/20 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md hover:border-kalahari transition-all"
          >
            <div className="p-5">
              <h4 className="font-bold text-olive dark:text-off-white text-lg mb-2 group-hover:text-kalahari transition-colors line-clamp-2">
                {hunt.title}
              </h4>
              {hunt.location && (
                <p className="text-sm text-olive dark:text-off-white/70 mb-3">{hunt.location}</p>
              )}
              <p className="font-black text-olive dark:text-off-white text-xl">
                ${hunt.price?.toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}