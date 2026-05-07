"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client"; 
import { MapPin, Calendar, DollarSign, User, AlertCircle, Target, Star, Globe } from "lucide-react";
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
  species?: string[]; // CRITICAL FIX: Added to satisfy TS compiler for the search algorithm
  location?: string; // Legacy / Display string
  country?: string;  // New strict field
  region?: string;   // New strict field
  price?: number;
  basePrice?: number;
  coverImage?: string;
  imageUrl?: string;
  images?: string[];
  outfitterName?: string;
  outfitterId?: string;
  duration?: number | string;
  createdAt?: any;
  effectiveTier?: string; 
}

function MarketplaceContent() {
  const searchParams = useSearchParams();
  
  const [allHunts, setAllHunts] = useState<Hunt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Expanded filters to handle strict country selection
  const [filters, setFilters] = useState({
    query: searchParams.get("q")?.toLowerCase() || "",
    location: searchParams.get("loc")?.toLowerCase() || "",
    country: searchParams.get("country")?.toLowerCase() || "",
    maxPrice: searchParams.get("price") ? Number(searchParams.get("price")) : null,
  });

  useEffect(() => {
    const fetchHunts = async () => {
      try {
        // 1. Fetch all approved hunts
        const snapshot = await getDocs(query(collection(db, "hunts"), where("status", "==", "APPROVED")));
        let rawHunts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hunt));
        
        rawHunts = rawHunts.filter(hunt => !hunt.isSpecialOffer);

        // 2. Resolve live SaaS tiers for search ranking
        const uniqueOutfitterIds = [...new Set(rawHunts.map(h => h.outfitterId).filter(Boolean))] as string[];
        
        const outfitterDocs = await Promise.all(
          uniqueOutfitterIds.map(uid => getDoc(doc(db, "outfitters", uid)))
        );

        const outfitterTiers = new Map<string, string>();
        outfitterDocs.forEach(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const isPromoActive = data.promoExpiresAt && new Date(data.promoExpiresAt) > new Date();
            const effectiveTier = (isPromoActive || data.tier === "PRO" || data.tier === "pro") ? "PRO" : "STANDARD";
            outfitterTiers.set(docSnap.id, effectiveTier);
          }
        });

        // 3. Enforce Soft Lock & Tier Application
        const processedHunts: Hunt[] = [];
        const outfitterHuntCounts = new Map<string, number>();

        rawHunts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        for (const hunt of rawHunts) {
          const oid = hunt.outfitterId;
          if (!oid) continue;

          const tier = outfitterTiers.get(oid) || "STANDARD";
          hunt.effectiveTier = tier; 

          if (tier === "STANDARD") {
            const count = outfitterHuntCounts.get(oid) || 0;
            if (count >= 5) continue; 
            outfitterHuntCounts.set(oid, count + 1);
          }
          processedHunts.push(hunt);
        }

        // 4. Randomize initial display
        const randomizedHunts = processedHunts.sort(() => Math.random() - 0.5);
        setAllHunts(randomizedHunts);

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

  // 5. Multi-Country Filter Logic
  let filteredHunts = allHunts.filter((hunt) => {
    let matchesQuery = true;
    let matchesLocation = true;
    let matchesPrice = true;

    if (filters.query) {
      const searchableText = `${hunt.title || ''} ${hunt.primarySpecies || ''} ${hunt.additionalSpecies || ''} ${Array.isArray(hunt.species) ? hunt.species.join(" ") : ""}`.toLowerCase();
      matchesQuery = searchableText.includes(filters.query);
    }

    // Prioritize strict country filter, fallback to broad location string matching
    if (filters.country) {
      matchesLocation = hunt.country?.toLowerCase() === filters.country;
    } else if (filters.location) {
      const huntLocation = `${hunt.location || ''} ${hunt.country || ''} ${hunt.region || ''}`.toLowerCase();
      matchesLocation = huntLocation.includes(filters.location);
    }

    if (filters.maxPrice) {
      const huntPrice = hunt.price || hunt.basePrice || 0;
      matchesPrice = huntPrice <= filters.maxPrice;
    }

    return matchesQuery && matchesLocation && matchesPrice;
  });

  // 6. Featured Sort: Push PRO hunts to the top
  filteredHunts.sort((a, b) => {
    if (a.effectiveTier === "PRO" && b.effectiveTier !== "PRO") return -1;
    if (a.effectiveTier !== "PRO" && b.effectiveTier === "PRO") return 1;
    return 0;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><KuduLoader /></div>;

  return (
    <div className="relative min-h-screen bg-black">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <div className="fixed inset-0 z-0">
        <Image
          src="/waterbuck-bg.jpg"
          alt="Waterbuck Background"
          fill
          priority
          quality={90}
          className="object-cover object-center opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80" />
      </div>

      <div className="relative z-10 flex flex-col items-center min-h-screen pt-24 pb-24">
        
        <div className="max-w-4xl w-full text-center px-6 mb-12">
          <h1 className="text-5xl md:text-7xl font-black font-headline text-white drop-shadow-lg mb-6 uppercase tracking-wide">
            The Marketplace
          </h1>
          <p className="text-lg md:text-xl font-medium text-off-white/90 max-w-2xl mx-auto drop-shadow-md">
            Explore premier hunting concessions across Southern Africa. 
            Verified outfitters from South Africa, Namibia, Zimbabwe, Botswana, and Mozambique.
          </p>
        </div>

        <div className="w-full relative z-20">
          <MarketplaceFilterBar 
            initialSearch={filters.query}
            initialLocation={filters.location}
            initialPrice={filters.maxPrice}
            onFilterUpdate={(updates: any) => setFilters(prev => ({ ...prev, ...updates }))} 
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 w-full">
          
          <div className="mb-6 flex justify-between items-end border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white font-headline">
              {filteredHunts.length} {filteredHunts.length === 1 ? 'Safari' : 'Safaris'} Found
            </h2>
          </div>

          {filteredHunts.length === 0 ? (
            <div className="text-center py-24 bg-white/5 backdrop-blur-md border-2 border-dashed border-white/20 rounded-2xl shadow-sm">
              <AlertCircle className="mx-auto h-16 w-16 text-kalahari/60 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2 font-headline">No Safaris Found</h3>
              <p className="text-off-white/70 max-w-md mx-auto mb-8 font-medium">
                We couldn't find any packages in this region. Try selecting a different country or broadening your price range.
              </p>
              <button 
                onClick={() => setFilters({ query: "", location: "", country: "", maxPrice: null })}
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
                  {hunt.effectiveTier === "PRO" && (
                    <div className="absolute top-3 right-3 z-10 bg-kalahari text-olive font-black px-2 py-1 rounded text-[10px] flex items-center shadow-lg uppercase tracking-widest">
                      <Star className="h-3 w-3 mr-1 fill-olive" /> Featured
                    </div>
                  )}

                  <div className="relative h-48 w-full bg-black/50 border-b border-white/10 overflow-hidden flex items-center justify-center">
                    {hunt.coverImage || hunt.imageUrl || (hunt.images && hunt.images[0]) ? (
                      <Image src={hunt.coverImage || hunt.imageUrl || hunt.images?.[0] || "/placeholder.jpg"} alt={hunt.title || "Hunt Preview"} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="opacity-30 grayscale drop-shadow-sm">
                        <Image src="/logo-transparent.png" alt="Only-Hunts" width={64} height={64} />
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
                            {(hunt.price || hunt.basePrice || 0).toLocaleString()}
                          </div>
                        )}
                      </div>

                      <h3 className="text-lg font-bold font-headline text-white line-clamp-2 group-hover:text-kalahari transition-colors mb-4">
                        {hunt.title || "Hunting Package"}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 pt-4 border-t border-white/10 mt-auto">
                      <div className="flex items-center text-off-white/80 text-[10px] font-black uppercase">
                        <MapPin className="h-3.5 w-3.5 mr-1.5 text-kalahari shrink-0" />
                        <span className="truncate">
                          {hunt.region ? `${hunt.region}, ${hunt.country}` : (hunt.location || "South Africa")}
                        </span>
                      </div>
                      <div className="flex items-center text-off-white/80 text-[10px] font-black uppercase">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-kalahari shrink-0" />
                        <span>{hunt.duration ? `${hunt.duration} Days` : "Varies"}</span>
                      </div>
                      {hunt.primarySpecies && (
                        <div className="flex items-center text-off-white/80 text-[10px] font-black uppercase col-span-2">
                          <Target className="h-3.5 w-3.5 mr-1.5 text-kalahari shrink-0" />
                          <span className="truncate">Target: {hunt.primarySpecies}</span>
                        </div>
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