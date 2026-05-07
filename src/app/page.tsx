"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client"; 
import { ArrowRight, Flame } from "lucide-react";

// Components
import MarketplaceSearch from "@/components/marketplace/MarketplaceSearch";
import KuduLoader from "@/components/ui/KuduLoader";
import AuthModal from "@/components/auth/AuthModal"; 
import TrustBanner from "@/components/ui/TrustBanner";
import MissionCard from "@/components/home/MissionCard";
import SearchResultsGrid from "@/components/home/SearchResultsGrid";
import DiscoveryFeed from "@/components/home/DiscoveryFeed";
import { getActiveAdsByPlacement } from "@/app/actions/ads";

interface Hunt {
  id: string;
  status: string;
  isSpecialOffer?: boolean;
  promoTier?: string;
  createdAt: any;
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
  outfitterId?: string;
  duration?: number;
  effectiveTier?: string; 
}

export default function HomePage({ searchParams }: { searchParams: any }) {
  const [allHunts, setAllHunts] = useState<Hunt[]>([]);
  const [inFeedAds, setInFeedAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [maxPriceQuery, setMaxPriceQuery] = useState<number | null>(null);

  // --- 1. PARAMETER UNWRAPPING ---
  useEffect(() => {
    const unwrapParams = async () => {
      const params = await searchParams;
      if (params?.q) setSearchQuery(String(params.q).toLowerCase());
      if (params?.loc) setLocationQuery(String(params.loc).toLowerCase());
      if (params?.price) setMaxPriceQuery(parseInt(String(params.price)));
    };
    unwrapParams();
  }, [searchParams]);

  // --- 2. DATA FETCHING ENGINE ---
  useEffect(() => {
    const fetchHunts = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, "hunts"), where("status", "==", "APPROVED")));
        let rawHunts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hunt));

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

    fetchHunts();

    const unsubscribe = auth.onAuthStateChanged((user) => setIsAuthenticated(!!user));
    return () => unsubscribe();
  }, []);

  const handleRestrictedClick = (e: React.MouseEvent, targetHref: string) => {
    if (!isAuthenticated) {
      e.preventDefault(); 
      setShowAuthModal(true); 
    }
  };

  // --- 3. THE SEARCH FILTER ENGINE ---
  const filteredHunts = allHunts.filter((hunt) => {
    if (hunt.isSpecialOffer === true) return false;

    let matchesQuery = true;
    let matchesLocation = true;
    let matchesPrice = true;

    if (searchQuery) {
      const searchableText = `${hunt.title || ''} ${hunt.primarySpecies || ''} ${hunt.additionalSpecies || ''}`.toLowerCase();
      matchesQuery = searchableText.includes(searchQuery);
    }
    if (locationQuery) {
      const huntLocation = `${hunt.location || ''} ${hunt.province || ''}`.toLowerCase();
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

  const isSearching = searchQuery || locationQuery || maxPriceQuery;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-olive"><KuduLoader /></div>;

  return (
    <div className="flex-grow bg-olive">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Show Hero Image only if they haven't searched yet */}
      {!isSearching && (
        <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[65vh] md:min-h-[85vh] flex items-center justify-center">
          <div className="absolute inset-0 z-0 bg-cover bg-[position:75%_center] md:bg-center bg-no-repeat" style={{ backgroundImage: "url('/Only-Hunts_backround.png')" }}></div>
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/85 via-black/10 via-90% to-olive"></div>
          
          <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10 w-full mt-8 md:mt-0">
            <div className="relative mb-4 md:mb-6 group w-28 md:w-48 lg:w-56">
              <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full scale-150 animate-pulse mix-blend-screen pointer-events-none" />
              <Image src="/logo-transparent.png" alt="Only-Hunts Premium Marketplace" width={256} height={256} className="relative z-10 w-full h-auto drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-500" priority />
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-headline font-extrabold tracking-tight mb-2 md:mb-3 text-off-white drop-shadow-xl leading-none">Only-Hunts</h1>
            <div className="inline-block bg-black/40 backdrop-blur-md px-6 py-2.5 md:py-3 md:px-8 rounded-full border border-kalahari/20 shadow-[0_4px_30px_rgba(0,0,0,0.8)] mt-2 md:mt-4">
              <p className="text-xs md:text-sm text-kalahari mb-0 font-black tracking-[0.2em] md:tracking-[0.25em] uppercase text-center drop-shadow-md">Ancient Pursuit. Modern Precision.</p>
            </div>
          </div>
        </section>
      )}

      {/* The Search Bar Always Remains Visible */}
      <MarketplaceSearch />

      {/* If Searching: Show Grid. If Browsing: Show the normal feed. */}
      {isSearching ? (
        <SearchResultsGrid hunts={filteredHunts} isAuthenticated={isAuthenticated} />
      ) : (
        <>
          {/* VERIFIED OUTFITTER DIRECTORY CTA */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-12 flex justify-center">
            <Link href="/outfitters" onClick={(e) => handleRestrictedClick(e, "/outfitters")} className="group block w-full max-w-3xl overflow-hidden rounded-2xl border-2 border-kalahari/30 bg-black/40 shadow-xl transition-all hover:border-kalahari/80 hover:shadow-kalahari/10">
              <div className="relative h-64 sm:h-80 w-full overflow-hidden border-b-2 border-kalahari/30">
                <Image src="/directory-cover.jpg" alt="South African Outfitter Directory" fill className="object-cover transition-transform duration-700 group-hover:scale-105" priority />
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

          {/* ONLY-HUNTS SPECIALS BANNER */}
          <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mt-4 mb-16 relative z-20">
            <div className="bg-black/80 backdrop-blur-md rounded-3xl overflow-hidden relative border-4 border-orange-500 shadow-xl group transition-colors">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
              <div className="relative z-10 p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="h-16 w-16 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.5)] border-2 border-orange-500 relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                    <Image src="/logo-transparent.png" alt="Only-Hunts Specials" width={48} height={48} className="drop-shadow-lg" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 transition-colors">
                      <Flame className="h-3 w-3" /> Limited Availability
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black font-headline text-white mb-1 tracking-tight">Only-Hunts <span className="text-orange-500">Specials</span></h2>
                    <p className="text-off-white/70 font-medium text-sm transition-colors max-w-lg">Score last-minute cancellations and exclusive discounted packages directly from our verified outfitters.</p>
                  </div>
                </div>
                <Link href="/specials" onClick={(e) => handleRestrictedClick(e, "/specials")} className="shrink-0 w-full md:w-auto">
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