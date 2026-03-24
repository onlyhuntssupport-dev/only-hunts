"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Flame, MapPin, Calendar, Target, Clock, ArrowRight, DollarSign } from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";
import { Button } from "@/components/ui/button";

interface Hunt {
  id: string;
  title: string;
  outfitterName: string;
  price: number;
  duration: number;
  location: string;
  primarySpecies: string;
  coverImage?: string;
  imageUrl?: string;
}

export default function SpecialsPage() {
  const [loading, setLoading] = useState(true);
  const [specials, setSpecials] = useState<Hunt[]>([]);

  useEffect(() => {
    const fetchSpecials = async () => {
      try {
        const huntsRef = collection(db, "hunts");
        // Only pull approved hunts that the outfitter specifically flagged as a special
        const q = query(
          huntsRef, 
          where("status", "==", "APPROVED"),
          where("isSpecialOffer", "==", true)
        );
        
        const snapshot = await getDocs(q);
        const fetchedSpecials = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Hunt[];

        // Randomize or sort by newest (for now, simple random shuffle so it feels dynamic)
        setSpecials(fetchedSpecials.sort(() => 0.5 - Math.random()));
      } catch (err) {
        console.error("Error fetching specials:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecials();
  }, []);

  if (loading) return <KuduLoader />;

  return (
    <div className="min-h-screen bg-off-white pb-24">
      
      {/* HERO SECTION */}
      <div className="bg-olive relative pt-20 pb-24 border-b-4 border-orange-500 overflow-hidden">
        {/* Abstract pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest mb-6">
            <Flame className="h-4 w-4" /> Limited Availability
          </div>
          <h1 className="text-5xl md:text-7xl font-black font-headline text-off-white tracking-tight mb-6">
            Last-Minute <span className="text-orange-500">Specials</span>
          </h1>
          <p className="text-off-white/80 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Exclusive deals on premium hunting packages. These are highly sought-after cancellations and special offers directly from verified outfitters. They won't last long.
          </p>
        </div>
      </div>

      {/* GRID SECTION */}
      <div className="max-w-7xl mx-auto px-6 mt-16">
        {specials.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-kalahari/30 rounded-3xl p-16 text-center max-w-2xl mx-auto shadow-sm">
            <Clock className="mx-auto h-16 w-16 text-kalahari/40 mb-6" />
            <h2 className="text-3xl font-black font-headline text-olive dark:text-off-white mb-4">No Specials Right Now</h2>
            <p className="text-olive dark:text-off-white/70 font-medium text-lg mb-8">
              All of our outfitters are currently fully booked. Check back soon, as last-minute cancellations pop up frequently!
            </p>
            <Link href="/hunts">
              <Button size="lg" className="bg-olive hover:bg-olive/90 text-kalahari font-black shadow-md">
                Browse Standard Packages <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {specials.map((hunt) => (
              <Link 
                key={hunt.id} 
                href={`/hunts/${hunt.id}`}
                className="group flex flex-col bg-white rounded-2xl border-2 border-orange-100 overflow-hidden hover:border-orange-400 hover:shadow-xl transition-all duration-300 relative"
              >
                {/* Image Container */}
                <div className="relative h-64 w-full bg-kalahari/10 overflow-hidden">
                  {hunt.coverImage || hunt.imageUrl ? (
                    <img 
                      src={hunt.coverImage || hunt.imageUrl} 
                      alt={hunt.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Target className="h-12 w-12 text-olive dark:text-off-white/20" />
                    </div>
                  )}
                  
                  {/* Fire Badge */}
                  <div className="absolute top-4 left-4 bg-orange-500 text-white font-black px-3 py-1.5 rounded-lg text-sm flex items-center shadow-lg uppercase tracking-wider">
                    <Flame className="h-4 w-4 mr-1.5 animate-pulse" /> Deal
                  </div>
                  
                  {/* Price Tag */}
                  <div className="absolute bottom-4 right-4 bg-olive text-kalahari font-black px-4 py-2 rounded-xl text-lg flex items-center shadow-lg">
                    <DollarSign className="h-5 w-5 mr-0.5" />
                    {hunt.price.toLocaleString()}
                  </div>
                </div>

                {/* Content Container */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="text-xs font-bold text-orange-600 mb-2 uppercase tracking-widest">
                    By {hunt.outfitterName || "Verified Outfitter"}
                  </div>
                  
                  <h3 className="text-xl font-black font-headline text-olive dark:text-off-white mb-4 line-clamp-2 group-hover:text-orange-600 transition-colors">
                    {hunt.title}
                  </h3>
                  
                  <div className="space-y-3 mt-auto pt-4 border-t-2 border-orange-50">
                    <div className="flex items-center text-olive dark:text-off-white text-sm font-bold opacity-80">
                      <MapPin className="h-4 w-4 mr-2.5 text-orange-500 shrink-0" />
                      <span className="truncate">{hunt.location}</span>
                    </div>
                    <div className="flex items-center text-olive dark:text-off-white text-sm font-bold opacity-80">
                      <Calendar className="h-4 w-4 mr-2.5 text-orange-500 shrink-0" />
                      <span>{hunt.duration} Days</span>
                    </div>
                    <div className="flex items-center text-olive dark:text-off-white text-sm font-bold opacity-80">
                      <Target className="h-4 w-4 mr-2.5 text-orange-500 shrink-0" />
                      <span className="truncate">{hunt.primarySpecies || "Multiple Species"}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}