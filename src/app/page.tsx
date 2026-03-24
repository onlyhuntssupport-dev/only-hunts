import Link from "next/link";
import Image from "next/image";
import { adminDb } from "@/lib/firebase/admin";
import { MapPin, Calendar, DollarSign, ArrowRight, Compass, User, AlertCircle, Target, Flame, Star } from "lucide-react";
import MarketplaceSearch from "@/components/marketplace/MarketplaceSearch";
import { Button } from "@/components/ui/button";

// --- THE CRITICAL FIX: Forces the page to always load fresh so your Auth layout doesn't break ---
export const dynamic = "force-dynamic"; 

async function getApprovedHunts() {
  try {
    const snapshot = await adminDb
      .collection("hunts")
      .where("status", "==", "APPROVED")
      .get();

    if (snapshot.empty) {
      return [];
    }

    const hunts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    return hunts.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Failed to fetch approved hunts:", error);
    return [];
  }
}

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  
  const searchQuery = typeof resolvedParams.q === 'string' ? resolvedParams.q.toLowerCase() : '';
  const locationQuery = typeof resolvedParams.loc === 'string' ? resolvedParams.loc.toLowerCase() : '';
  const maxPriceQuery = typeof resolvedParams.price === 'string' ? parseInt(resolvedParams.price) : null;

  const allHunts = await getApprovedHunts();

  const filteredHunts = allHunts.filter((hunt) => {
    // Hide special offers from the standard feeds
    if (hunt.isSpecialOffer === true) {
      return false;
    }

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
      const huntPrice = hunt.price || hunt.basePrice || 0;
      matchesPrice = huntPrice <= maxPriceQuery;
    }

    return matchesQuery && matchesLocation && matchesPrice;
  });

  // --- RESTORED PROMOTIER LOGIC (2-Tier System) ---
  // We use your existing database tags, but only separate Featured vs Everything Else
  const featuredHunts = filteredHunts.filter(hunt => hunt.promoTier === "FEATURED");
  const standardHunts = filteredHunts.filter(hunt => hunt.promoTier !== "FEATURED");

  return (
    <div className="flex-grow bg-off-white dark:bg-olive transition-colors duration-300">
      
      {/* COMPRESSED HERO SECTION */}
      <section className="bg-olive dark:bg-black/20 text-off-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          <Compass className="h-10 w-10 text-kalahari mb-4" />
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight mb-4 text-off-white">
            Find Your Next Great Adventure
          </h1>
          <p className="text-lg text-kalahari max-w-2xl mb-8 font-medium">
            Browse premium, verified hunting packages from top-rated outfitters across South Africa. 
          </p>
          
          <Link href="#marketplace" className="bg-kalahari hover:bg-white text-olive dark:text-off-white font-black px-8 py-3 rounded flex items-center justify-center shadow-lg text-lg border-2 border-kalahari transition-colors">
            Browse Hunts <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* SEARCH BAR */}
      <MarketplaceSearch />

      {/* MARKETPLACE SECTION */}
      <section id="marketplace" className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between border-b-2 border-kalahari/20 dark:border-kalahari/30 pb-4">
          <div>
            <h2 className="text-2xl font-headline font-bold text-olive dark:text-off-white">
              {searchQuery || locationQuery || maxPriceQuery ? 'Search Results' : 'Marketplace'}
            </h2>
            <p className="text-olive/70 dark:text-kalahari mt-1 font-bold text-sm">
              {filteredHunts.length} {filteredHunts.length === 1 ? 'package found' : 'packages found'}
            </p>
          </div>
        </div>

        {allHunts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-black/20 border-2 border-dashed border-kalahari/30 dark:border-kalahari/30 rounded-xl shadow-sm transition-colors">
            <Compass className="mx-auto h-12 w-12 text-kalahari/50 mb-4" />
            <h3 className="text-xl font-bold text-olive dark:text-off-white mb-2">Check Back Soon</h3>
            <p className="text-olive/70 dark:text-off-white/70 max-w-md mx-auto font-medium">
              Our outfitters are currently preparing new packages. Once approved by our team, they will appear right here.
            </p>
          </div>
        ) : filteredHunts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-black/20 border-2 border-dashed border-kalahari/40 rounded-xl shadow-sm transition-colors">
            <AlertCircle className="mx-auto h-12 w-12 text-kalahari/60 mb-4" />
            <h3 className="text-xl font-bold text-olive dark:text-off-white mb-2">No Matches Found</h3>
            <p className="text-olive/70 dark:text-off-white/70 max-w-md mx-auto mb-6 font-medium">
              We couldn't find any packages matching your exact search criteria. Try removing some filters to see more results.
            </p>
            <Link href="/" className="inline-block bg-kalahari hover:bg-kalahari/90 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              View All Packages
            </Link>
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* TIER 1: FEATURED PACKAGES */}
            {featuredHunts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-6 w-6 text-kalahari fill-kalahari" />
                  <h3 className="text-xl font-headline font-black text-olive dark:text-off-white">Featured Packages</h3>
                </div>
                
                {/* COMPACT HORIZONTAL LIST FOR FEATURED */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {featuredHunts.map((hunt) => (
                    <Link 
                      href={`/hunts/${hunt.id}`} 
                      key={hunt.id}
                      className="group flex flex-col sm:flex-row bg-white dark:bg-black/30 rounded-xl border-2 border-kalahari/40 dark:border-kalahari/50 overflow-hidden hover:shadow-xl hover:border-kalahari dark:hover:border-kalahari transition-all duration-300 h-auto sm:h-48 relative"
                    >
                      {/* Image Left */}
                      <div className="relative h-48 sm:h-full w-full sm:w-2/5 shrink-0 bg-off-white dark:bg-black/50 border-b-2 sm:border-b-0 sm:border-r-2 border-kalahari/20 overflow-hidden">
                        {hunt.coverImage || hunt.imageUrl || (hunt.images && hunt.images[0]) ? (
                          <Image src={hunt.coverImage || hunt.imageUrl || hunt.images[0]} alt={hunt.title || "Hunting Package"} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-kalahari"><Compass className="h-10 w-10" /></div>
                        )}
                        <div className="absolute top-3 left-3 bg-kalahari text-olive font-black px-2 py-1 rounded text-[10px] flex items-center shadow-md uppercase tracking-widest">
                          <Star className="h-3 w-3 mr-1 fill-olive" /> Featured
                        </div>
                      </div>

                      {/* Content Right */}
                      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-center bg-gradient-to-r from-transparent to-kalahari/5 dark:to-transparent">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-olive/60 dark:text-off-white/50 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 truncate">
                            <User className="h-3 w-3 shrink-0" /> {hunt.outfitterName || "Verified Outfitter"}
                          </span>
                          {(hunt.price || hunt.basePrice) && (
                            <div className="bg-olive dark:bg-black/80 text-kalahari font-bold px-2 py-1 rounded text-xs flex items-center shrink-0">
                              <DollarSign className="h-3 w-3 mr-0.5" />
                              {(hunt.price || hunt.basePrice).toLocaleString()}
                            </div>
                          )}
                        </div>

                        <h3 className="text-lg md:text-xl font-bold font-headline text-olive dark:text-off-white line-clamp-2 group-hover:text-kalahari transition-colors mb-3">
                          {hunt.title || "Untitled Hunting Package"}
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-auto pt-3 border-t border-kalahari/20 transition-colors">
                          <div className="flex items-center text-olive/80 dark:text-off-white/80 text-xs font-bold uppercase"><MapPin className="h-3.5 w-3.5 mr-1.5 text-kalahari shrink-0" /><span className="truncate">{hunt.location || "South Africa"}</span></div>
                          <div className="flex items-center text-olive/80 dark:text-off-white/80 text-xs font-bold uppercase"><Calendar className="h-3.5 w-3.5 mr-1.5 text-kalahari shrink-0" /><span>{hunt.duration ? `${hunt.duration} Days` : "Varies"}</span></div>
                          {hunt.primarySpecies && (
                            <div className="flex items-center text-olive/80 dark:text-off-white/80 text-xs font-bold uppercase col-span-2"><Target className="h-3.5 w-3.5 mr-1.5 text-kalahari shrink-0" /><span className="truncate">Target: {hunt.primarySpecies}</span></div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* TIER 2: STANDARD PACKAGES */}
            {standardHunts.length > 0 && (
              <div>
                <h3 className="text-xl font-headline font-black text-olive dark:text-off-white mb-4">
                  {featuredHunts.length > 0 ? "More Packages" : "All Packages"}
                </h3>
                
                {/* COMPACT HORIZONTAL LIST FOR STANDARD */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {standardHunts.map((hunt) => (
                    <Link 
                      href={`/hunts/${hunt.id}`} 
                      key={hunt.id}
                      className="group flex flex-col sm:flex-row bg-white dark:bg-black/30 rounded-xl border border-kalahari/20 dark:border-kalahari/20 overflow-hidden hover:border-kalahari/60 dark:hover:border-kalahari/50 hover:shadow-md transition-all duration-300 h-auto sm:h-40"
                    >
                      {/* Image Left */}
                      <div className="relative h-48 sm:h-full w-full sm:w-48 shrink-0 bg-off-white dark:bg-black/50 border-b sm:border-b-0 sm:border-r border-kalahari/20 overflow-hidden">
                        {hunt.coverImage || hunt.imageUrl || (hunt.images && hunt.images[0]) ? (
                          <Image src={hunt.coverImage || hunt.imageUrl || hunt.images[0]} alt={hunt.title || "Hunting Package"} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-kalahari"><Compass className="h-8 w-8" /></div>
                        )}
                      </div>

                      {/* Content Right */}
                      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-center">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-olive/50 dark:text-off-white/40 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 truncate">
                            <User className="h-3 w-3 shrink-0" /> {hunt.outfitterName || "Verified Outfitter"}
                          </span>
                          {(hunt.price || hunt.basePrice) && (
                            <div className="text-olive dark:text-kalahari font-black text-xs flex items-center shrink-0">
                              <DollarSign className="h-3 w-3 mr-0.5" />
                              {(hunt.price || hunt.basePrice).toLocaleString()}
                            </div>
                          )}
                        </div>

                        <h3 className="text-base md:text-lg font-bold font-headline text-olive dark:text-off-white line-clamp-2 group-hover:text-kalahari transition-colors mb-2">
                          {hunt.title || "Untitled Hunting Package"}
                        </h3>
                        
                        <div className="flex gap-4 mt-auto pt-2 border-t border-kalahari/10 transition-colors">
                          <div className="flex items-center text-olive/70 dark:text-off-white/60 text-[11px] font-bold uppercase"><MapPin className="h-3 w-3 mr-1 text-kalahari shrink-0" /><span className="truncate">{hunt.location || "SA"}</span></div>
                          <div className="flex items-center text-olive/70 dark:text-off-white/60 text-[11px] font-bold uppercase"><Calendar className="h-3 w-3 mr-1 text-kalahari shrink-0" /><span>{hunt.duration ? `${hunt.duration} Days` : "Varies"}</span></div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        )}
      </section>

      {/* ONLY-HUNTS SPECIALS BANNER (Unchanged, just dark mode synced) */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mt-4 mb-16">
        <div className="bg-olive dark:bg-black/40 rounded-3xl overflow-hidden relative border-4 border-orange-500 shadow-xl group transition-colors">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
          <div className="relative z-10 p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="h-16 w-16 bg-orange-500 rounded-full flex items-center justify-center shrink-0 shadow-lg">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 transition-colors">
                  <Flame className="h-3 w-3" /> Limited Availability
                </div>
                <h2 className="text-2xl md:text-3xl font-black font-headline text-white mb-1 tracking-tight">
                  Only-Hunts <span className="text-orange-500">Specials</span>
                </h2>
                <p className="text-white/80 dark:text-off-white/70 font-medium text-sm transition-colors max-w-lg">
                  Score last-minute cancellations and exclusive discounted packages directly from our verified outfitters.
                </p>
              </div>
            </div>

            <Link href="/specials" className="shrink-0 w-full md:w-auto">
              <div className="bg-orange-500 hover:bg-orange-600 text-white font-black text-sm h-12 px-8 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 w-full border-2 border-orange-400">
                View Deals <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}