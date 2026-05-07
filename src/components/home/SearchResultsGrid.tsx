import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar, DollarSign, User, AlertCircle, Star } from "lucide-react";

export default function SearchResultsGrid({ hunts, isAuthenticated }: { hunts: any[], isAuthenticated: boolean }) {
  if (hunts.length === 0) {
    return (
      <div className="text-center py-20 bg-black/40 backdrop-blur-sm border-2 border-dashed border-kalahari/40 rounded-xl shadow-sm max-w-4xl mx-auto mt-8">
        <AlertCircle className="mx-auto h-12 w-12 text-kalahari/60 mb-4" />
        <h3 className="text-xl font-bold text-off-white mb-2">No Matches Found</h3>
        <p className="text-off-white/60">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-headline font-black text-white mb-8 border-b border-kalahari/20 pb-4">
        Search Results ({hunts.length})
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {hunts.map((hunt) => (
          <Link 
            key={hunt.id}
            href={`/hunts/${hunt.id}`} 
            className="group flex flex-col bg-black/60 backdrop-blur-md rounded-xl border border-kalahari/30 overflow-hidden hover:border-kalahari hover:shadow-xl transition-all duration-300"
          >
            <div className="relative h-56 w-full bg-black/50 border-b border-kalahari/20 overflow-hidden flex items-center justify-center">
              {hunt.coverImage || hunt.imageUrl || (hunt.images && hunt.images.length > 0) ? (
                <Image src={hunt.coverImage || hunt.imageUrl || hunt.images?.[0] || "/logo-transparent.png"} alt={hunt.title || "Hunting Package"} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="opacity-30 grayscale drop-shadow-sm">
                  <Image src="/logo-transparent.png" alt="Placeholder" width={48} height={48} />
                </div>
              )}
              {hunt.effectiveTier === "PRO" && (
                <div className="absolute top-3 left-3 bg-kalahari text-olive font-black px-2 py-1 rounded text-[10px] flex items-center shadow-md uppercase tracking-widest z-10">
                  <Star className="h-3 w-3 mr-1 fill-olive" /> Featured
                </div>
              )}
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
      </div>
    </div>
  );
}