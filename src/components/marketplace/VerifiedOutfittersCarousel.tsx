"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { getSecureVerifiedOutfitters } from "@/app/actions/outfitters";
import { ShieldCheck, MapPin, Star, User, ChevronRight, ArrowRight, Lock } from "lucide-react";

interface OutfitterCard {
  id: string;
  companyName: string;
  location: string;
  profileImageUrl: string;
  coverImageUrl: string;
  rating: number;
  reviewCount: number;
}

export default function VerifiedOutfittersCarousel() {
  const [outfitters, setOutfitters] = useState<OutfitterCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsAuthenticated(true);
        // User is logged in -> Fetch the data securely
        const response = await getSecureVerifiedOutfitters();
        if (response.success) {
          setOutfitters(response.data);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-8 flex justify-center">
        <div className="animate-pulse h-64 w-full max-w-7xl bg-kalahari/10 rounded-2xl"></div>
      </div>
    );
  }

  // THE LEAD MAGNET: Render the locked state if they aren't logged in
  if (!isAuthenticated) {
    return (
      <div className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden border-2 border-kalahari/20 bg-olive dark:bg-black/40 shadow-2xl">
          {/* Blurred Background Mockup */}
          <div className="absolute inset-0 flex gap-4 p-6 opacity-20 blur-md pointer-events-none overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 w-72 bg-white rounded-2xl shrink-0 border border-gray-300"></div>
            ))}
          </div>
          
          {/* The Lock Overlay */}
          <div className="relative z-10 py-20 px-6 flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-kalahari/20 rounded-full flex items-center justify-center mb-6 border-2 border-kalahari shadow-[0_0_15px_rgba(209,164,123,0.5)]">
              <Lock className="h-10 w-10 text-kalahari" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black font-headline text-off-white mb-4">
              Verified Outfitter Directory is Locked
            </h2>
            <p className="text-lg text-off-white/70 max-w-xl mx-auto mb-8 font-medium">
              Create a free Hunter profile to unlock our entire network of fully-vetted, premium outfitters and access direct marketplace pricing.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/register" className="bg-kalahari hover:bg-white text-olive dark:text-olive font-black px-8 py-3.5 rounded-xl shadow-lg transition-all hover:scale-105 w-full sm:w-auto">
                Create Free Account
              </Link>
              <Link href="/login" className="text-off-white hover:text-kalahari font-bold px-6 py-3 transition-colors">
                Already have an account?
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // IF LOGGED IN: Render the actual Carousel
  if (outfitters.length === 0) return null;

  return (
    <div className="w-full py-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black font-headline text-olive dark:text-off-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-kalahari" /> Verified Outfitters
          </h2>
          <p className="text-olive/70 dark:text-off-white/60 mt-1 font-medium">
            Book with confidence. These professionals have been vetted by our team.
          </p>
        </div>
        
        <Link href="/outfitters" className="flex items-center text-sm font-bold text-kalahari hover:text-kalahari/80 transition-colors shrink-0">
          View Directory <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      <div className="flex overflow-x-auto gap-6 pb-8 px-4 sm:px-6 lg:px-8 snap-x snap-mandatory hide-scrollbar max-w-7xl mx-auto">
        {outfitters.map((outfitter) => (
          <Link 
            href={`/outfitters/${outfitter.id}`} 
            key={outfitter.id}
            className="snap-start shrink-0 w-72 md:w-80 group outline-none"
          >
            <div className="bg-white dark:bg-black/30 border-2 border-kalahari/10 dark:border-kalahari/20 rounded-2xl overflow-hidden hover:border-kalahari dark:hover:border-kalahari/80 hover:shadow-xl transition-all duration-300 h-full flex flex-col relative">
              
              <div className="absolute top-3 right-3 z-10 bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                <ShieldCheck className="h-4 w-4" />
              </div>

              <div className="h-24 w-full bg-kalahari/20 relative">
                {outfitter.coverImageUrl ? (
                  <img src={outfitter.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-olive to-kalahari/80"></div>
                )}
              </div>

              <div className="absolute top-16 left-5 h-16 w-16 bg-off-white dark:bg-gray-800 border-4 border-white dark:border-gray-900 rounded-xl overflow-hidden shadow-md">
                {outfitter.profileImageUrl ? (
                  <img src={outfitter.profileImageUrl} alt={outfitter.companyName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-kalahari/10">
                    <User className="h-8 w-8 text-kalahari/50" />
                  </div>
                )}
              </div>

              <div className="pt-10 p-5 flex flex-col flex-1">
                <h3 className="text-lg font-black font-headline text-olive dark:text-off-white truncate group-hover:text-kalahari transition-colors">
                  {outfitter.companyName}
                </h3>
                
                <div className="flex items-center text-olive/70 dark:text-off-white/60 text-xs font-bold mt-1.5 mb-3 uppercase tracking-wide">
                  <MapPin className="h-3.5 w-3.5 mr-1 text-kalahari shrink-0" />
                  <span className="truncate">{outfitter.location}</span>
                </div>

                <div className="mt-auto pt-4 border-t border-kalahari/10 dark:border-kalahari/20 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-kalahari fill-kalahari" />
                    <span className="font-bold text-olive dark:text-white text-sm">{outfitter.rating > 0 ? outfitter.rating.toFixed(1) : "New"}</span>
                    <span className="text-olive/50 dark:text-off-white/40 text-xs ml-0.5">({outfitter.reviewCount})</span>
                  </div>
                  <div className="text-xs font-bold text-kalahari flex items-center group-hover:underline">
                    View Profile <ChevronRight className="h-3 w-3 ml-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* The Prominent CTA Button */}
      <div className="text-center px-6 mt-2 max-w-7xl mx-auto">
        <Link 
          href="/outfitters" 
          className="inline-flex items-center justify-center border-2 border-kalahari text-kalahari hover:bg-kalahari hover:text-white font-black px-8 py-3.5 rounded-xl transition-all hover:shadow-lg w-full sm:w-auto"
        >
          Browse All Verified Outfitters <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}