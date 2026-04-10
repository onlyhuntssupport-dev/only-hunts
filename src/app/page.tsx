"use client"; // Switched to client-side to manage auth state & modals

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client"; // Use client DB
import { MapPin, Calendar, DollarSign, ArrowRight, Compass, User, AlertCircle, Target, Flame, Star, ChevronRight } from "lucide-react";
import MarketplaceSearch from "@/components/marketplace/MarketplaceSearch";
import KuduLoader from "@/components/ui/KuduLoader";

// MODAL ACTIVATED: Imported the AuthModal component
import AuthModal from "@/components/auth/AuthModal"; 

// TRUST SIGNALS ACTIVATED
import TrustBanner from "@/components/ui/TrustBanner";

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
  duration?: number;
}

export default function HomePage({ searchParams }: { searchParams: any }) {
  const [allHunts, setAllHunts] = useState<Hunt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [maxPriceQuery, setMaxPriceQuery] = useState<number | null>(null);

  useEffect(() => {
    const unwrapParams = async () => {
      const params = await searchParams;
      if (params?.q) setSearchQuery(String(params.q).toLowerCase());
      if (params?.loc) setLocationQuery(String(params.loc).toLowerCase());
      if (params?.price) setMaxPriceQuery(parseInt(String(params.price)));
    };
    unwrapParams();
  }, [searchParams]);

  useEffect(() => {
    const fetchHunts = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, "hunts"), where("status", "==", "APPROVED")));
        let huntsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hunt));
        
        // Let's shuffle the data slightly so it's not always the exact same order for fairness
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

  // Cap the displays to a maximum of 8 items for the carousel
  const featuredHunts = filteredHunts.filter(hunt => hunt.promoTier === "FEATURED").slice(0, 8);
  const standardHunts = filteredHunts.filter(hunt => hunt.promoTier !== "FEATURED").slice(0, 8);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-olive"><KuduLoader /></div>;

  return (
    <div className="flex-grow bg-olive">
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* ========================================== */}
      {/* IMMERSIVE HERO SECTION (MOBILE HEIGHT FIXED) */}
      {/* ========================================== */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[65vh] md:min-h-[85vh] flex items-center justify-center">
        
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-[position:75%_center] md:bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/Only-Hunts_backround.png')" }}
        ></div>
        
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/85 via-black/10 via-90% to-olive"></div>
        
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10 w-full mt-8 md:mt-0">
          
          <div className="relative mb-6 md:mb-10 group w-28 md:w-48 lg:w-56">
            <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full scale-150 animate-pulse mix-blend-screen pointer-events-none" />
            <Image 
              src="/logo-transparent.png" 
              alt="Only-Hunts Premium Marketplace" 
              width={256} 
              height={256} 
              className="relative z-10 w-full h-auto drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-500"
              priority
            />
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-black tracking-tighter mb-3 md:mb-4 text-white drop-shadow-xl uppercase leading-tight">
            Tell Your <span className="text-kalahari">Story</span>
          </h1>
          
          <p className="text-base md:text-xl text-off-white/90 max-w-2xl mb-0 font-bold tracking-wide drop-shadow-md leading-relaxed px-4">
            The Premier Marketplace for Verified South African Outfitters.
          </p>
          
        </div>
      </section>

      <MarketplaceSearch />

      {/* VERIFIED OUTFITTER DIRECTORY CTA */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-12 flex justify-center">
        <Link 
          href="/outfitters" 
          onClick={(e) => handleRestrictedClick(e, "/outfitters")}
          className="group block w-full max-w-3xl overflow-hidden rounded-2xl border-2 border-kalahari/30 bg-black/40 shadow-xl transition-all hover:border-kalahari/80 hover:shadow-kalahari/10"
        >
          <div className="relative h-64 sm:h-80 w-full overflow-hidden border-b-2 border-kalahari/30">
            <Image
              src="/directory-cover.jpg"
              alt="South African Outfitter Directory"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
            <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] pointer-events-none"></div>
          </div>

          <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black font-headline text-off-white">
                Only-Hunts Outfitters
              </h2>
              <p className="mt-2 text-sm text-kalahari font-bold uppercase tracking-widest">
                View Verified Directory
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
              <div className="inline-flex items-center justify-center bg-kalahari text-white font-black px-6 py-3 rounded-xl transition-all group-hover:bg-kalahari/90 group-hover:-translate-y-1 w-full sm:w-auto shadow-md">
                Explore Directory <ArrowRight className="ml-2 h-5 w-5" />
              </div>
              
              {!isAuthenticated && (
                <span className="text-[10px] font-bold text-off-white/40 uppercase tracking-widest w-full text-center sm:text-right mt-1">
                  Requires Free Account
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>

      <TrustBanner />

      {/* ========================================== */}
      {/* HORIZONTAL SWIPE MARKETPLACE SECTION       */}
      {/* ========================================== */}
      <section id="marketplace" className="relative py-16 pl-4 sm:pl-6 lg:pl-8 max-w-[100vw] overflow-hidden">
        
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero-shot.jpg')" }}
        ></div>
        
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-olive via-black/70 to-black/75"></div>

        <div className="relative z-10">
          <div className="mb-8 flex items-center justify-between pr-4 sm:pr-6 lg:pr-8">
            <div>
              <h2 className="text-3xl font-headline font-black text-off-white drop-shadow-md">
                {searchQuery || locationQuery || maxPriceQuery ? 'Search Results' : 'The Marketplace'}
              </h2>
              <p className="text-kalahari mt-2 font-bold text-sm drop-shadow-sm">
                Swipe to explore verified packages
              </p>
            </div>
          </div>

          {allHunts.length === 0 ? (
            <div className="text-center py-20 mr-4 sm:mr-6 lg:mr-8 bg-black/40 backdrop-blur-sm border-2 border-dashed border-kalahari/30 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold text-off-white mb-2">Check Back Soon</h3>
              <p className="text-off-white/70 max-w-md mx-auto font-medium">
                Our outfitters are currently preparing new packages.
              </p>
            </div>
          ) : filteredHunts.length === 0 ? (
            <div className="text-center py-20 mr-4 sm:mr-6 lg:mr-8 bg-black/40 backdrop-blur-sm border-2 border-dashed border-kalahari/40 rounded-xl shadow-sm">
              <AlertCircle className="mx-auto h-12 w-12 text-kalahari/60 mb-4" />
              <h3 className="text-xl font-bold text-off-white mb-2">No Matches Found</h3>
            </div>
          ) : (
            <div className="space-y-12">
              
              {/* TIER 1: FEATURED CAROUSEL */}
              {featuredHunts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-6 w-6 text-kalahari fill-kalahari" />
                    <h3 className="text-xl font-headline font-black text-off-white drop-shadow-md">Featured Packages</h3>
                  </div>
                  
                  <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-4 sm:pr-6 lg:pr-8">
                    {featuredHunts.map((hunt) => (
                      <Link 
                        href={`/hunts/${hunt.id}`} 
                        key={hunt.id}
                        className="group flex flex-col bg-black/60 backdrop-blur-md rounded-xl border-2 border-kalahari/50 overflow-hidden hover:shadow-xl hover:border-kalahari transition-all duration-300 shrink-0 w-[85vw] sm:w-[320px] lg:w-[350px] snap-start"
                      >
                        <div className="relative h-56 w-full shrink-0 bg-black/50 border-b-2 border-kalahari/20 overflow-hidden flex items-center justify-center">
                          {hunt.coverImage || hunt.imageUrl || (hunt.images && hunt.images.length > 0) ? (
                            <Image src={hunt.coverImage || hunt.imageUrl || hunt.images?.[0] || "/logo-transparent.png"} alt={hunt.title || "Hunting Package"} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="opacity-30 grayscale drop-shadow-sm">
                              <Image src="/logo-transparent.png" alt="Placeholder" width={48} height={48} />
                            </div>
                          )}
                          <div className="absolute top-3 left-3 bg-kalahari text-olive font-black px-2 py-1 rounded text-[10px] flex items-center shadow-md uppercase tracking-widest">
                            <Star className="h-3 w-3 mr-1 fill-olive" /> Featured
                          </div>
                        </div>

                        <div className="p-5 flex flex-col flex-grow justify-center">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-off-white/60 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 truncate pr-2">
                              <User className="h-3 w-3 shrink-0 text-kalahari" /> 
                              {isAuthenticated ? (hunt.outfitterName || "Verified Outfitter") : "Verified Outfitter"}
                            </span>
                            {(hunt.price !== undefined || hunt.basePrice !== undefined) && (
                              <div className="bg-black/90 text-kalahari border border-kalahari/20 font-bold px-2 py-1 rounded text-xs flex items-center shrink-0 shadow-sm">
                                <DollarSign className="h-3 w-3 mr-0.5" />
                                {(hunt.price ?? hunt.basePrice ?? 0).toLocaleString()}
                              </div>
                            )}
                          </div>

                          <h3 className="text-lg font-bold font-headline text-white line-clamp-2 group-hover:text-kalahari transition-colors mb-4 min-h-[3.5rem]">
                            {hunt.title || "Untitled Hunting Package"}
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-y-2 gap-x-2 mt-auto pt-4 border-t border-kalahari/20">
                            <div className="flex items-center text-off-white/80 text-[11px] font-bold uppercase"><MapPin className="h-3.5 w-3.5 mr-1.5 text-kalahari shrink-0" /><span className="truncate">{hunt.location || "South Africa"}</span></div>
                            <div className="flex items-center text-off-white/80 text-[11px] font-bold uppercase"><Calendar className="h-3.5 w-3.5 mr-1.5 text-kalahari shrink-0" /><span>{hunt.duration ? `${hunt.duration} Days` : "Varies"}</span></div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    
                    <Link 
                      href="/marketplace"
                      className="group flex flex-col items-center justify-center bg-black/40 backdrop-blur-md border-2 border-dashed border-kalahari/30 rounded-xl hover:border-kalahari hover:bg-kalahari/20 transition-all duration-300 shrink-0 w-[85vw] sm:w-[320px] lg:w-[350px] snap-start min-h-[350px]"
                    >
                      <div className="h-16 w-16 bg-kalahari/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <ChevronRight className="h-8 w-8 text-kalahari" />
                      </div>
                      <h3 className="text-xl font-headline font-black text-off-white mb-1">View All</h3>
                      <p className="text-xs text-kalahari font-bold uppercase tracking-widest">Search the Marketplace</p>
                    </Link>
                  </div>
                </div>
              )}

              {/* TIER 2: STANDARD CAROUSEL */}
              {standardHunts.length > 0 && (
                <div>
                  <h3 className="text-xl font-headline font-black text-off-white mb-4 drop-shadow-md">
                    {featuredHunts.length > 0 ? "More Packages" : "All Packages"}
                  </h3>
                  
                  <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-4 sm:pr-6 lg:pr-8">
                    {standardHunts.map((hunt) => (
                      <Link 
                        href={`/hunts/${hunt.id}`} 
                        key={hunt.id}
                        className="group flex flex-col bg-black/60 backdrop-blur-md rounded-xl border border-kalahari/20 overflow-hidden hover:border-kalahari/50 hover:shadow-md transition-all duration-300 shrink-0 w-[75vw] sm:w-[280px] lg:w-[300px] snap-start"
                      >
                        <div className="relative h-48 w-full shrink-0 bg-black/50 border-b border-kalahari/20 overflow-hidden flex items-center justify-center">
                          {hunt.coverImage || hunt.imageUrl || (hunt.images && hunt.images.length > 0) ? (
                            <Image src={hunt.coverImage || hunt.imageUrl || hunt.images?.[0] || "/logo-transparent.png"} alt={hunt.title || "Hunting Package"} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="opacity-30 grayscale drop-shadow-sm">
                              <Image src="/logo-transparent.png" alt="Placeholder" width={40} height={40} />
                            </div>
                          )}
                        </div>

                        <div className="p-4 flex flex-col flex-grow justify-center">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-off-white/50 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 truncate pr-2">
                              <User className="h-3 w-3 shrink-0 text-kalahari" /> 
                              {isAuthenticated ? (hunt.outfitterName || "Verified Outfitter") : "Verified Outfitter"}
                            </span>
                            {(hunt.price !== undefined || hunt.basePrice !== undefined) && (
                              <div className="text-kalahari font-black text-xs flex items-center shrink-0 drop-shadow-sm">
                                <DollarSign className="h-3 w-3 mr-0.5" />
                                {(hunt.price ?? hunt.basePrice ?? 0).toLocaleString()}
                              </div>
                            )}
                          </div>

                          <h3 className="text-base font-bold font-headline text-white line-clamp-2 group-hover:text-kalahari transition-colors mb-4 min-h-[3rem]">
                            {hunt.title || "Untitled Hunting Package"}
                          </h3>
                          
                          <div className="flex justify-between mt-auto pt-3 border-t border-kalahari/10">
                            <div className="flex items-center text-off-white/70 text-[10px] font-bold uppercase"><MapPin className="h-3 w-3 mr-1 text-kalahari shrink-0" /><span className="truncate max-w-[80px]">{hunt.location || "SA"}</span></div>
                            <div className="flex items-center text-off-white/70 text-[10px] font-bold uppercase"><Calendar className="h-3 w-3 mr-1 text-kalahari shrink-0" /><span>{hunt.duration ? `${hunt.duration} Days` : "Varies"}</span></div>
                          </div>
                        </div>
                      </Link>
                    ))}

                    <Link 
                      href="/marketplace"
                      className="group flex flex-col items-center justify-center bg-black/40 backdrop-blur-md border-2 border-dashed border-kalahari/30 rounded-xl hover:border-kalahari hover:bg-kalahari/20 transition-all duration-300 shrink-0 w-[75vw] sm:w-[280px] lg:w-[300px] snap-start min-h-[300px]"
                    >
                      <ArrowRight className="h-6 w-6 text-kalahari mb-2 group-hover:translate-x-1 transition-transform" />
                      <span className="font-bold text-off-white text-sm">View All</span>
                    </Link>
                  </div>
                </div>
              )}
              
            </div>
          )}
        </div>
      </section>

      {/* ONLY-HUNTS SPECIALS BANNER (GATED) */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mt-4 mb-16 relative z-20">
        <div className="bg-black/80 backdrop-blur-md rounded-3xl overflow-hidden relative border-4 border-orange-500 shadow-xl group transition-colors">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
          <div className="relative z-10 p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-6">
              
              <div className="h-16 w-16 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.5)] border-2 border-orange-500 relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                <Image 
                  src="/logo-transparent.png" 
                  alt="Only-Hunts Specials" 
                  width={48} 
                  height={48} 
                  className="drop-shadow-lg"
                />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 transition-colors">
                  <Flame className="h-3 w-3" /> Limited Availability
                </div>
                <h2 className="text-2xl md:text-3xl font-black font-headline text-white mb-1 tracking-tight">
                  Only-Hunts <span className="text-orange-500">Specials</span>
                </h2>
                <p className="text-off-white/70 font-medium text-sm transition-colors max-w-lg">
                  Score last-minute cancellations and exclusive discounted packages directly from our verified outfitters.
                </p>
              </div>
            </div>

            <Link 
              href="/specials" 
              onClick={(e) => handleRestrictedClick(e, "/specials")}
              className="shrink-0 w-full md:w-auto"
            >
              <div className="bg-orange-500 hover:bg-orange-600 text-white font-black text-sm h-12 px-8 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 w-full border-2 border-orange-400">
                View Deals <ArrowRight className="h-4 w-4" />
              </div>
              {!isAuthenticated && (
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-2 text-center">
                  Account Required
                </p>
              )}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}