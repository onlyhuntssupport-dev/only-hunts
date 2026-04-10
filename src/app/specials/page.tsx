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

        setSpecials(fetchedSpecials.sort(() => 0.5 - Math.random()));
      } catch (err) {
        console.error("Error fetching specials:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecials();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-olive flex items-center justify-center">
        <KuduLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-olive pb-24 text-off-white font-body relative">
      
      {/* INJECTED SUNSET BACKGROUND - Opacity updated from 50 to 35 to make it 15% lighter */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-35"
        style={{ backgroundImage: "url('/specials-bg.jpg')" }}
      ></div>
      
      {/* Background ambient gradient */}
      <div className="fixed top-0 inset-x-0 h-[600px] bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-0"></div>
      
      {/* HERO SECTION */}
      <div className="relative pt-32 pb-20 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-6 relative text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-sm">
            <Flame className="h-4 w-4" /> Limited Availability
          </div>
          <h1 className="text-5xl md:text-7xl font-black font-headline text-white tracking-tight mb-6 drop-shadow-md">
            Last-Minute <span className="text-kalahari">Specials</span>
          </h1>
          <p className="text-off-white/90 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-sm">
            Exclusive deals on premium hunting packages. These are highly sought-after cancellations and special offers directly from verified outfitters. They won't last long.
          </p>
        </div>
      </div>

      {/* GRID SECTION */}
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {specials.length === 0 ? (
          <div className="bg-black/40 backdrop-blur-md border border-kalahari/20 rounded-3xl p-16 text-center max-w-2xl mx-auto shadow-2xl">
            <Clock className="mx-auto h-16 w-16 text-kalahari/40 mb-6 drop-shadow-sm" />
            <h2 className="text-3xl font-black font-headline text-white mb-4">No Specials Right Now</h2>
            <p className="text-off-white/80 font-medium text-lg mb-8 leading-relaxed">
              All of our outfitters are currently fully booked. Check back soon, as last-minute cancellations pop up frequently!
            </p>
            <Link href="/marketplace">
              <Button size="lg" className="bg-kalahari hover:bg-white text-olive font-black shadow-lg hover:shadow-xl transition-all rounded-xl h-14 px-8">
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
                className="group flex flex-col bg-black/40 backdrop-blur-md rounded-3xl border border-kalahari/20 overflow-hidden hover:border-kalahari/60 hover:shadow-2xl hover:shadow-kalahari/10 transition-all duration-500 relative"
              >
                {/* Image Container */}
                <div className="relative h-64 w-full bg-black/60 overflow-hidden border-b border-kalahari/10">
                  {hunt.coverImage || hunt.imageUrl ? (
                    <img 
                      src={hunt.coverImage || hunt.imageUrl} 
                      alt={hunt.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Target className="h-12 w-12 text-off-white/20" />
                    </div>
                  )}
                  
                  {/* Fire Badge */}
                  <div className="absolute top-4 left-4 bg-orange-500/20 backdrop-blur-md text-orange-300 border border-orange-500/30 font-black px-3 py-1.5 rounded-lg text-xs flex items-center shadow-lg uppercase tracking-widest">
                    <Flame className="h-4 w-4 mr-1.5 animate-pulse text-orange-500" /> Deal
                  </div>
                  
                  {/* Price Tag */}
                  <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md border border-kalahari/30 text-kalahari font-black px-4 py-2 rounded-xl text-lg flex items-center shadow-lg">
                    <DollarSign className="h-5 w-5 mr-0.5" />
                    {hunt.price.toLocaleString()}
                  </div>
                </div>

                {/* Content Container */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="text-xs font-bold text-kalahari mb-2 uppercase tracking-widest">
                    By {hunt.outfitterName || "Verified Outfitter"}
                  </div>
                  
                  <h3 className="text-xl font-black font-headline text-white mb-4 line-clamp-2 group-hover:text-kalahari transition-colors drop-shadow-sm">
                    {hunt.title}
                  </h3>
                  
                  <div className="space-y-3 mt-auto pt-5 border-t border-kalahari/10">
                    <div className="flex items-center text-off-white/90 text-sm font-bold">
                      <MapPin className="h-4 w-4 mr-2.5 text-kalahari shrink-0" />
                      <span className="truncate">{hunt.location}</span>
                    </div>
                    <div className="flex items-center text-off-white/90 text-sm font-bold">
                      <Calendar className="h-4 w-4 mr-2.5 text-kalahari shrink-0" />
                      <span>{hunt.duration} Days</span>
                    </div>
                    <div className="flex items-center text-off-white/90 text-sm font-bold">
                      <Target className="h-4 w-4 mr-2.5 text-kalahari shrink-0" />
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