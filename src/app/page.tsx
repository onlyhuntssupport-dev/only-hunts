"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Flame } from "lucide-react";

// PERFORMANCE FIX: Critical above-the-fold components load synchronously
import MarketplaceSearch from "@/components/marketplace/MarketplaceSearch";
import KuduLoader from "@/components/ui/KuduLoader";
import AuthModal from "@/components/auth/AuthModal"; 
import SearchResultsGrid from "@/components/home/SearchResultsGrid";
import { getActiveAdsByPlacement } from "@/app/actions/ads";

// PERFORMANCE FIX: Heavy below-the-fold components are code-split and lazy-loaded
const TrustBanner = dynamic(() => import("@/components/ui/TrustBanner"));
const MissionCard = dynamic(() => import("@/components/home/MissionCard"));
const DiscoveryFeed = dynamic(() => import("@/components/home/DiscoveryFeed"));

interface Hunt {
  id: string;
  status: string;
  isSpecialOffer?: boolean;
  promoTier?: string;
  createdAt: any;
  title?: string;
  primarySpecies?: string;
  additionalSpecies?: string;
  species?: string[];
  location?: string;
  country?: string;
  region?: string;
  province?: string;
  price?: number;
  basePrice?: number;
  coverImage?: string;
  imageUrl?: string;
  images?: string[];
  outfitterName?: string;
  outfitterId?: string;
  duration?: number;
  effectiveTier?: string; 
}

function HomeContent() {
  const searchParams = useSearchParams();
  
  const [allHunts, setAllHunts] = useState<Hunt[]>([]);
  const [inFeedAds, setInFeedAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const searchQuery = searchParams.get("q")?.toLowerCase() || "";
  const locationQuery = searchParams.get("loc")?.toLowerCase() || "";
  const countryQuery = searchParams.get("country")?.toLowerCase() || "";
  const priceParam = searchParams.get("price");
  const maxPriceQuery = priceParam ? parseInt(priceParam) : null;

  useEffect(() => {
    let unsubscribe: () => void;

    const initFirebaseAndFetch = async () => {
      try {
        const { db, auth } = await import("@/lib/firebase/client");
        const { collection, query, where, getDocs, doc, getDoc } = await import("firebase/firestore");

        unsubscribe = auth.onAuthStateChanged((user) => setIsAuthenticated(!!user));

        const snapshot = await getDocs(query(collection(db, "hunts"), where("status", "==", "APPROVED")));
        let rawHunts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Hunt));

        const uniqueOutfitterIds = [...new Set(rawHunts.map(h => h.outfitterId).filter(Boolean))] as string[];
        const outfitterDocs = await Promise.all(uniqueOutfitterIds.map(uid => getDoc(doc(db, "outfitters", uid))));

        const outfitterTiers = new Map<string, string>();
        outfitterDocs.forEach(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const isPromoActive = data.promoExpiresAt && new Date(data.promoExpiresAt) > new Date();
            const effectiveTier = (isPromoActive || data.tier === "PRO" || data.tier === "pro") ? "PRO" : "STANDARD";
            outfitterTiers.set(docSnap.id, effectiveTier);
          }
        });

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

        setAllHunts(processedHunts.sort(() => Math.random() - 0.5));

        const adsRes = await getActiveAdsByPlacement("IN_FEED");
        if (adsRes.success && adsRes.data) setInFeedAds(adsRes.data);
      } catch (error) {
        console.error("Failed to fetch hunts:", error);
      } finally {
        setLoading(false);
      }
    };

    initFirebaseAndFetch();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleRestrictedClick = (e: React.MouseEvent, targetHref: string) => {
    if (!isAuthenticated) {
      e.preventDefault(); 
      setShowAuthModal(true); 
    }
  };

  const filteredHunts = allHunts.filter((hunt) => {
    if (hunt.isSpecialOffer === true) return false;

    let matchesQuery = true;
    let matchesLocation = true;
    let matchesPrice = true;

    if (searchQuery) {
      const searchableText = `${hunt.title || ''} ${hunt.primarySpecies || ''} ${hunt.additionalSpecies || ''} ${Array.isArray(hunt.species) ? hunt.species.join(" ") : ""}`.toLowerCase();
      matchesQuery = searchableText.includes(searchQuery);
    }
    
    if (countryQuery) {
      matchesLocation = hunt.country?.toLowerCase() === countryQuery;
    } else if (locationQuery) {
      const huntLocation = `${hunt.location || ''} ${hunt.country || ''} ${hunt.region || ''} ${hunt.province || ''}`.toLowerCase();
      matchesLocation = huntLocation.includes(locationQuery);
    }

    if (maxPriceQuery) {
      const huntPrice = hunt.price ?? hunt.basePrice ?? 0;
      matchesPrice = huntPrice <= maxPriceQuery;
    }

    return matchesQuery && matchesLocation && matchesPrice;
  });

  const featuredHunts = filteredHunts.filter(hunt => hunt.effectiveTier === "PRO").slice(0, 8);
  const standardHunts = filteredHunts.filter(hunt => hunt.effectiveTier !== "PRO").slice(0, 8);
  const isSearching = searchQuery || locationQuery || countryQuery || maxPriceQuery;

  return (
    <div className="flex-grow bg-olive">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {!isSearching && (
        <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[65vh] md:min-h-[85vh] flex items-center justify-center">
          <div className="absolute inset-0 z-0">
            <Image 
              src="/Only-Hunts_backround.webp" 
              alt="Only-Hunts African Safari Background" 
              fill 
              priority
              fetchPriority="high"
              quality={85}
              sizes="100vw"
              className="object-cover object-[75%_center] md:object-center" 
            />
          </div>
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/85 via-black/10 via-90% to-olive"></div>
          
          <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10 w-full mt-8 md:mt-0">
            <div className="relative mb-4 md:mb-6 group w-32 h-32 md:w-48 md:h-48 lg:w-56 lg:h-56 mx-auto">
              <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full scale-150 animate-pulse mix-blend-screen pointer-events-none" />
              <Image 
                src="/logo-transparent.webp" 
                alt="Only-Hunts Premium Marketplace" 
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 768px) 128px, (max-width: 1024px) 192px, 224px"
                className="object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-500 relative z-10" 
              />
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-headline font-extrabold tracking-tight mb-2 md:mb-3 text-off-white drop-shadow-xl leading-none">Only-Hunts</h1>
            <div className="inline-block bg-black/40 backdrop-blur-md px-6 py-2.5 md:py-3 md:px-8 rounded-full border border-kalahari/20 shadow-[0_4px_30px_rgba(0,0,0,0.8)] mt-2 md:mt-4">
              <p className="text-xs md:text-sm text-kalahari mb-0 font-black tracking-[0.2em] md:tracking-[0.25em] uppercase text-center drop-shadow-md">Ancient Pursuit. Modern Precision.</p>
            </div>
          </div>
        </section>
      )}

      <MarketplaceSearch />

      {/* PERFORMANCE FIX: Internal loading state locked to 100vh to match HeroFallback and prevent Footer Yo-Yo shift */}
      {loading ? (
        <div className="min-h-[100vh] flex items-center justify-center bg-olive">
          <KuduLoader />
        </div>
      ) : isSearching ? (
        <SearchResultsGrid hunts={filteredHunts} isAuthenticated={isAuthenticated} />
      ) : (
        <>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-12 flex justify-center">
            <Link prefetch={false} href="/outfitters" onClick={(e) => handleRestrictedClick(e, "/outfitters")} className="group block w-full max-w-3xl overflow-hidden rounded-2xl border-2 border-kalahari/30 bg-black/40 shadow-xl transition-all hover:border-kalahari/80 hover:shadow-kalahari/10">
              <div className="relative h-64 sm:h-80 w-full overflow-hidden border-b-2 border-kalahari/30 bg-olive">
                <Image 
                  src="/directory-cover.webp" 
                  alt="South African Outfitter Directory" 
                  fill 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                  quality={80}
                  className="object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] pointer-events-none"></div>
              </div>
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black font-headline text-off-white">Only-Hunts Outfitters</h2>
                  <p className="mt-2 text-sm text-kalahari font-bold uppercase tracking-widest">View Verified Directory</p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                  <div className="inline-flex items-center justify-center bg-kalahari text-white font-black px-6 py-3 rounded-xl transition-all group-hover:bg-kalahari/90 group-hover:-translate-y-1 w-full sm:w-auto shadow-md">
                    Explore Directory <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                  {!isAuthenticated && <span className="text-[10px] font-bold text-off-white/40 uppercase tracking-widest w-full text-center sm:text-right mt-1">Requires Free Account</span>}
                </div>
              </div>
            </Link>
          </div>

          <TrustBanner />
          
          <DiscoveryFeed featuredHunts={featuredHunts} standardHunts={standardHunts} inFeedAds={inFeedAds} isAuthenticated={isAuthenticated} />

          <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mt-4 mb-16 relative z-20">
            <div className="bg-black/80 backdrop-blur-md rounded-3xl overflow-hidden relative border-4 border-orange-500 shadow-xl group transition-colors">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
              <div className="relative z-10 p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="relative h-16 w-16 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.5)] border-2 border-orange-500 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                    <Image src="/logo-transparent.webp" alt="Only-Hunts Specials" fill sizes="64px" className="object-contain p-2 drop-shadow-lg" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 transition-colors">
                      <Flame className="h-3 w-3" /> Limited Availability
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black font-headline text-white mb-1 tracking-tight">Only-Hunts <span className="text-orange-500">Specials</span></h2>
                    <p className="text-off-white/70 font-medium text-sm transition-colors max-w-lg">Score last-minute cancellations and exclusive discounted packages directly from our verified outfitters.</p>
                  </div>
                </div>
                <Link prefetch={false} href="/specials" onClick={(e) => handleRestrictedClick(e, "/specials")} className="shrink-0 w-full md:w-auto">
                  <div className="bg-orange-500 hover:bg-orange-600 text-white font-black text-sm h-12 px-8 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 w-full border-2 border-orange-400">
                    View Deals <ArrowRight className="h-4 w-4" />
                  </div>
                  {!isAuthenticated && <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-2 text-center">Account Required</p>}
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

      <MissionCard />
    </div>
  );
}

const HeroFallback = () => (
  <div className="flex-grow flex flex-col w-full bg-olive">
    <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[65vh] md:min-h-[85vh] flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        <Image 
          src="/Only-Hunts_backround.webp" 
          alt="Only-Hunts African Safari Background" 
          fill 
          priority 
          fetchPriority="high"
          quality={85}
          sizes="100vw"
          className="object-cover object-[75%_center] md:object-center" 
        />
      </div>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/85 via-black/10 via-90% to-olive"></div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
        <KuduLoader />
      </div>
    </section>
    <div className="min-h-[100vh] w-full bg-olive"></div>
  </div>
);

export default function HomePage() {
  return (
    <Suspense fallback={<HeroFallback />}>
      <HomeContent />
    </Suspense>
  );
}