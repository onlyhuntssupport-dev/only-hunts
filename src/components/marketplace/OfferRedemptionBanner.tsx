"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Tag, CheckCircle } from "lucide-react";

interface Offer {
  id: string;
  message: string;
  outfitterId: string;
  createdAt: string;
}

export default function OfferRedemptionBanner({ huntId }: { huntId: string }) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveOffer = async (userId: string) => {
      try {
        const offersRef = collection(db, "offers");
        const q = query(
          offersRef, 
          where("hunterId", "==", userId),
          where("huntId", "==", huntId)
        );
        
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const fetchedOffers = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Offer[];
          
          fetchedOffers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOffer(fetchedOffers[0]);
        }
      } catch (err) {
        console.error("Error fetching offer:", err);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchActiveOffer(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [huntId]);

  if (loading || !offer) return null;

  return (
    <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-3 mb-4 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-kalahari"></div>
      
      <div className="flex items-center gap-2 mb-2">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
        </span>
        <h3 className="text-xs font-black text-orange-700 uppercase tracking-widest flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5" /> VIP Deal Applied
        </h3>
      </div>

      <div className="bg-white border border-orange-200 p-2 rounded text-slate-700 font-medium italic text-xs mb-2 shadow-sm">
        "{offer.message}"
      </div>

      <p className="text-[10px] font-bold text-orange-800 flex items-center gap-1">
        <CheckCircle className="h-3 w-3 text-green-600" />
        Exclusive rate will be attached to your request.
      </p>
    </div>
  );
}