import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar, DollarSign, User, Star, ChevronRight, ArrowRight } from "lucide-react";
import SponsoredAdCard from "@/components/marketplace/SponsoredAdCard";

export default function DiscoveryFeed({ featuredHunts, standardHunts, inFeedAds, isAuthenticated }: { featuredHunts: any[], standardHunts: any[], inFeedAds: any[], isAuthenticated: boolean }) {
  return (
    <section id="marketplace" className="relative py-16 pl-4 sm:pl-6 lg:pl-8 max-w-[100vw] overflow-hidden">
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/hero-shot.jpg')" }}></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-olive via-black/70 to-black/75"></div>

      <div className="relative z-10">
        <div className="mb-8 flex flex-col justify-center pr-4 sm:pr-6 lg:pr-8">
          <h2 className="text-4xl md:text-5xl font-headline font-black tracking-tighter mb-3 text-white drop-shadow-md uppercase">
            Tell Your <span className="text-kalahari">Story</span>
          </h2>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-off-white/90 drop-shadow-sm">The Marketplace</h3>
            <span className="text-kalahari/50 hidden sm:inline-block">•</span>
            <p className="text-kalahari font-bold text-sm drop-shadow-sm uppercase tracking-wider hidden sm:inline-block">Swipe to explore</p>
          </div>
        </div>

        <div className="space-y-12">
          {/* TIER 1: PRO / FEATURED CAROUSEL */}
          {featuredHunts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-6 w-6 text-kalahari fill-kalahari" />
                <h3 className="text-xl font-headline font-black text-off-white drop-shadow-md">Featured Packages</h3>
              </div>
              
              <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-4 sm:pr-6 lg:pr-8">
                {featuredHunts.map((hunt, index) => (
                  <React.Fragment key={hunt.id}>
                    <Link href={`/hunts/${hunt.id}`} className="group flex flex-col bg-black/60 backdrop-blur-md rounded-xl border-2 border-kalahari/50 overflow-hidden hover:shadow-xl hover:border-kalahari transition-all duration-300 shrink-0 w-[85vw] sm:w-[320px] lg:w-[350px] snap-start">
                      <div className="relative h-56 w-full shrink-0 bg-black/50 border-b-2 border-kalahari/20 overflow-hidden flex items-center justify-center">
                        {hunt.coverImage || hunt.imageUrl || (hunt.images && hunt.images.length > 0) ? (
                          <Image src={hunt.coverImage || hunt.imageUrl || hunt.images?.[0] || "/logo-transparent.png"} alt={hunt.title || "Hunting Package"} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="opacity-30 grayscale drop-shadow-sm"><Image src="/logo-transparent.png" alt="Placeholder" width={48} height={48} /></div>
                        )}
                        <div className="absolute top-3 left-3 bg-kalahari text-olive font-black px-2 py-1 rounded text-[10px] flex items-center shadow-md uppercase tracking-widest"><Star className="h-3 w-3 mr-1 fill-olive" /> Featured</div>
                      </div>

                      <div className="p-5 flex flex-col flex-grow justify-center">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-off-white/60 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 truncate pr-2"><User className="h-3 w-3 shrink-0 text-kalahari" /> {isAuthenticated ? (hunt.outfitterName || "Verified Outfitter") : "Verified Outfitter"}</span>
                          {(hunt.price !== undefined || hunt.basePrice !== undefined) && (
                            <div className="bg-black/90 text-kalahari border border-kalahari/20 font-bold px-2 py-1 rounded text-xs flex items-center shrink-0 shadow-sm"><DollarSign className="h-3 w-3 mr-0.5" />{(hunt.price ?? hunt.basePrice ?? 0).toLocaleString()}</div>
                          )}
                        </div>
                        <h3 className="text-lg font-bold font-headline text-white line-clamp-2 group-hover:text-kalahari transition-colors mb-4 min-h-[3.5rem]">{hunt.title || "Untitled Hunting Package"}</h3>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-2 mt-auto pt-4 border-t border-kalahari/20">
                          <div className="flex items-center text-off-white/80 text-[11px] font-bold uppercase"><MapPin className="h-3.5 w-3.5 mr-1.5 text-kalahari shrink-0" /><span className="truncate">{hunt.location || "South Africa"}</span></div>
                          <div className="flex items-center text-off-white/80 text-[11px] font-bold uppercase"><Calendar className="h-3.5 w-3.5 mr-1.5 text-kalahari shrink-0" /><span>{hunt.duration ? `${hunt.duration} Days` : "Varies"}</span></div>
                        </div>
                      </div>
                    </Link>
                    {/* INJECT AD #1 */}
                    {index === 1 && inFeedAds[0] && <SponsoredAdCard ad={inFeedAds[0]} />}
                  </React.Fragment>
                ))}
                
                <Link href="/marketplace" className="group flex flex-col items-center justify-center bg-black/40 backdrop-blur-md border-2 border-dashed border-kalahari/30 rounded-xl hover:border-kalahari hover:bg-kalahari/20 transition-all duration-300 shrink-0 w-[85vw] sm:w-[320px] lg:w-[350px] snap-start min-h-[350px]">
                  <div className="h-16 w-16 bg-kalahari/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><ChevronRight className="h-8 w-8 text-kalahari" /></div>
                  <h3 className="text-xl font-headline font-black text-off-white mb-1">View All</h3>
                  <p className="text-xs text-kalahari font-bold uppercase tracking-widest">Search the Marketplace</p>
                </Link>
              </div>
            </div>
          )}

          {/* TIER 2: STANDARD CAROUSEL */}
          {standardHunts.length > 0 && (
            <div>
              <h3 className="text-xl font-headline font-black text-off-white mb-4 drop-shadow-md">{featuredHunts.length > 0 ? "More Packages" : "All Packages"}</h3>
              <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-4 sm:pr-6 lg:pr-8">
                {standardHunts.map((hunt, index) => (
                  <React.Fragment key={hunt.id}>
                    <Link href={`/hunts/${hunt.id}`} className="group flex flex-col bg-black/60 backdrop-blur-md rounded-xl border border-kalahari/20 overflow-hidden hover:border-kalahari/50 hover:shadow-md transition-all duration-300 shrink-0 w-[75vw] sm:w-[280px] lg:w-[300px] snap-start">
                      <div className="relative h-48 w-full shrink-0 bg-black/50 border-b border-kalahari/20 overflow-hidden flex items-center justify-center">
                        {hunt.coverImage || hunt.imageUrl || (hunt.images && hunt.images.length > 0) ? (
                          <Image src={hunt.coverImage || hunt.imageUrl || hunt.images?.[0] || "/logo-transparent.png"} alt={hunt.title || "Hunting Package"} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="opacity-30 grayscale drop-shadow-sm"><Image src="/logo-transparent.png" alt="Placeholder" width={40} height={40} /></div>
                        )}
                      </div>
                      <div className="p-4 flex flex-col flex-grow justify-center">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-off-white/50 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 truncate pr-2"><User className="h-3 w-3 shrink-0 text-kalahari" /> {isAuthenticated ? (hunt.outfitterName || "Verified Outfitter") : "Verified Outfitter"}</span>
                          {(hunt.price !== undefined || hunt.basePrice !== undefined) && (
                            <div className="text-kalahari font-black text-xs flex items-center shrink-0 drop-shadow-sm"><DollarSign className="h-3 w-3 mr-0.5" />{(hunt.price ?? hunt.basePrice ?? 0).toLocaleString()}</div>
                          )}
                        </div>
                        <h3 className="text-base font-bold font-headline text-white line-clamp-2 group-hover:text-kalahari transition-colors mb-4 min-h-[3rem]">{hunt.title || "Untitled Hunting Package"}</h3>
                        <div className="flex justify-between mt-auto pt-3 border-t border-kalahari/10">
                          <div className="flex items-center text-off-white/70 text-[10px] font-bold uppercase"><MapPin className="h-3 w-3 mr-1 text-kalahari shrink-0" /><span className="truncate max-w-[80px]">{hunt.location || "SA"}</span></div>
                          <div className="flex items-center text-off-white/70 text-[10px] font-bold uppercase"><Calendar className="h-3 w-3 mr-1 text-kalahari shrink-0" /><span>{hunt.duration ? `${hunt.duration} Days` : "Varies"}</span></div>
                        </div>
                      </div>
                    </Link>
                    {/* INJECT AD #2 */}
                    {index === 2 && inFeedAds[1] && <SponsoredAdCard ad={inFeedAds[1]} isCompact={true} />}
                  </React.Fragment>
                ))}
                
                <Link href="/marketplace" className="group flex flex-col items-center justify-center bg-black/40 backdrop-blur-md border-2 border-dashed border-kalahari/30 rounded-xl hover:border-kalahari hover:bg-kalahari/20 transition-all duration-300 shrink-0 w-[75vw] sm:w-[280px] lg:w-[300px] snap-start min-h-[300px]">
                  <ArrowRight className="h-6 w-6 text-kalahari mb-2 group-hover:translate-x-1 transition-transform" />
                  <span className="font-bold text-off-white text-sm">View All</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}