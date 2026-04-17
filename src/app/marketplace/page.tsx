"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client"; 
import { MapPin, Calendar, DollarSign, User, AlertCircle, Target, Star } from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";
import AuthModal from "@/components/auth/AuthModal";
import MarketplaceFilterBar from "@/components/marketplace/MarketplaceFilterBar";

interface Hunt {
  id: string;
  status: string;
  isSpecialOffer?: boolean;
  promoTier?: string;
  title?: string;
  primarySpecies?: string;
  additionalSpecies?: string;
  location?: string;
  province?: string;
  price?: number;
  basePrice?: number;
  coverImage?: string;
  imageUrl?: string;
  images?: string[];
  outfitterName?: string;
  duration?: number;
}

function MarketplaceContent() {
  const searchParams = useSearchParams();
  
  const [allHunts, setAllHunts] = useState<Hunt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [filters, setFilters] = useState({
    query: searchParams.get("q")?.toLowerCase() || "",
    location: searchParams.get("loc")?.toLowerCase() || "",
    maxPrice: searchParams.get("price") ? Number(searchParams.get("price")) : null,
  });

  useEffect(() => {
    const fetchHunts = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, "hunts"), where("status", "==", "APPROVED")));
        let huntsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hunt));
        
        huntsData = huntsData.filter(hunt => !hunt.isSpecialOffer);
        huntsData = huntsData.sort(() => Math.random() - 0.5);

        setAllHunts(huntsData);
      } catch (error) {
        console.error("Failed to fetch hunts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHunts();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, []);

  const handleRestrictedClick = (e: React.MouseEvent, targetHref: string) => {
    if (!isAuthenticated) {
      e.preventDefault(); 
      setShowAuthModal(true); 
    }
  };

  const filteredHunts = allHunts.filter((hunt) => {
    let matchesQuery = true;
    let matchesLocation = true;
    let matchesPrice = true;

    if (filters.query) {
      const searchableText = `${hunt.title || ''} ${hunt.primarySpecies || ''} ${hunt.additionalSpecies || ''}`.toLowerCase();
      matchesQuery = searchableText.includes(filters.query);
    }
    if (filters.location) {
      const huntLocation = `${hunt.location || ''} ${hunt.province || ''}`.toLowerCase();
      matchesLocation = huntLocation.includes(filters.location);
    }
    if (filters.maxPrice) {
      const huntPrice = hunt.price || hunt.basePrice || 0;
      matchesPrice = huntPrice <= filters.maxPrice;
    }

    return matchesQuery && matchesLocation && matchesPrice;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><KuduLoader /></div>;

  return (
    <div className="relative min-h-screen bg-black">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* --- FIXED PARALLAX BACKGROUND --- */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/waterbuck-bg.jpg"
          alt="Waterbuck"
          fill
          priority
          quality={90}
          className="object-cover object-center opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80" />
      </div>

      {/* --- PAGE CONTENT --- */}
      <div className="relative z-10 flex flex-col items-center min-h-screen pt-24 pb-24">
        
        <div className="max-w-4xl w-full text-center px-6 mb-12">
          <h1 className="text-5xl md:text-7xl font-black font-headline text-white drop-shadow-lg mb-6 uppercase tracking-wide">
            The Marketplace
          </h1>
          <p className="text-lg md:text-xl font-medium text-off-white/90 max-w-2xl mx-auto drop-shadow-md">
            Browse verified hunting packages directly from South Africa's top outfitters. 
            Use the filters below to dial in your perfect safari.
          </p>
        </div>

        <div className="w-full relative z-20">
          <MarketplaceFilterBar 
            initialSearch={filters.query}
            initialLocation={filters.location}
            initialPrice={filters.maxPrice}
            onFilterUpdate={setFilters} 
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 w-full">
          
          <div className="mb-6 flex justify-between items-end border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white font-headline">
              {filteredHunts.length} {filteredHunts.length === 1 ? 'Package' : 'Packages'} Found
            </h2>
          </div>

          {filteredHunts.length === 0 ? (
            <div className="text-center py-24 bg-white/5 backdrop-blur-md border-2 border-dashed border-white/20 rounded-2xl shadow-sm">
              <AlertCircle className="mx-auto h-16 w-16 text-kalahari/60 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2 font-headline">No Safaris Found</h3>
              <p className="text-off-white/70 max-w-md mx-auto mb-8 font-medium">
                We couldn't find any packages matching your exact criteria. Try broadening your search or resetting the filters.
              </p>
              <button 
                onClick={() => setFilters({ query: "", location: "", maxPrice: null })}
                className="inline-block bg-kalahari hover:bg-kalahari/90 text-olive font-bold px-8 py-3 rounded-xl transition-colors shadow-md"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredHunts.map((hunt) => (
                <Link 
                  href={`/hunts/${hunt.id}`} 
                  key={hunt.id}
                  onClick={(e) => handleRestrictedClick(e, `/hunts/${hunt.id}`)}
                  className="group flex flex-col bg-white/5 dark:bg-black/40 backdrop-blur-md border border-white/10 dark:border-kalahari/30 rounded-2xl overflow-hidden hover:border-kalahari/50 transition-all duration-300 h-full relative"
                >
                  {hunt.promoTier === "FEATURED" && (
                    <div className="absolute top-3 right-3 z-10 bg-kalahari text-olive font-black px-2 py-1 rounded text-[10px] flex items-center shadow-lg uppercase tracking-widest">
                      <Star className="h-3 w-3 mr-1 fill-olive" /> Featured
                    </div>
                  )}

                  <div className="relative h-48 w-full bg-black/50 border-b border-white/10 overflow-hidden flex items-center justify-center">
                    {/* OVERRIDE: Added optional chaining to hunt.images to appease TS */}
                    {hunt.coverImage || hunt.imageUrl || (hunt.images && hunt.images[0]) ? (
                      <Image src={hunt.coverImage || hunt.imageUrl || hunt.images?.[0] || "/placeholder.jpg"} alt={hunt.title || "Hunting Package"} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="opacity-30 grayscale drop-shadow-sm">
                        <Image src="/logo-transparent.png" alt="Placeholder" width={64} height={64} />
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-grow justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-off-white/50 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 truncate pr-2">
                          <User className="h-3 w-3 shrink-0 text-kalahari" /> 
                          {isAuthenticated ? (hunt.outfitterName || "Verified Outfitter") : "Verified Outfitter"}
                        </span>
                        {(hunt.price || hunt.basePrice) && (
                          <div className="bg-black/80 text-kalahari font-bold px-2 py-1 rounded text-xs flex items-center shrink-0 border border-white/10 shadow-sm">
                            <DollarSign className="h-3 w-3 mr-0.5" />
                            {/* OVERRIDE: Added || 0 fallback for toLocaleString */}
                            {(hunt.price || hunt.basePrice || 0).toLocaleString()}
                          </div>
                        )}
                      </div>

                      <h3 className="text-lg font-bold font-headline text-white line-clamp-2 group-hover:text-kalahari transition-colors mb-4">
                        {hunt.title || "Untitled Hunting Package"}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 pt-4 border-t border-white/10 mt-auto">
                      <div className="flex items-center text-off-white/80 text-xs font-bold uppercase"><MapPin className="h-3.5 w-3.5 mr-1.5 text-kalahari shrink-0" /><span className="truncate">{hunt.location || "South Africa"}</span></div>
                      <div className="flex items-center text-off-white/80 text-xs font-bold uppercase"><Calendar className="h-3.5 w-3.5 mr-1.5 text-kalahari shrink-0" /><span>{hunt.duration ? `${hunt.duration} Days` : "Varies"}</span></div>
                      {hunt.primarySpecies && (
                        <div className="flex items-center text-off-white/80 text-xs font-bold uppercase col-span-2"><Target className="h-3.5 w-3.5 mr-1.5 text-kalahari shrink-0" /><span className="truncate">Target: {hunt.primarySpecies}</span></div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><KuduLoader /></div>}>
      <MarketplaceContent />
    </Suspense>
  );
}