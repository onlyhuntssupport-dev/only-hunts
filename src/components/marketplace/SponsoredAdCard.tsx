"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ExternalLink, Megaphone } from "lucide-react";
import { recordAdClick, recordAdImpression } from "@/app/actions/ads";

export default function SponsoredAdCard({ ad, isCompact = false }: { ad: any, isCompact?: boolean }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [hasRecordedImpression, setHasRecordedImpression] = useState(false);

  useEffect(() => {
    if (hasRecordedImpression || !cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          recordAdImpression(ad.id);
          setHasRecordedImpression(true);
          observer.disconnect();
        }
      },
      { threshold: 0.6 } // 60% of the ad must be visible to count as an impression
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [hasRecordedImpression, ad.id]);

  const handleClick = () => {
    recordAdClick(ad.id);
  };

  return (
    <a
      ref={cardRef}
      href={ad.targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`group flex flex-col bg-kalahari/10 backdrop-blur-md rounded-xl border-2 border-kalahari overflow-hidden hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300 shrink-0 snap-start relative ${
        isCompact ? "w-[75vw] sm:w-[280px] lg:w-[300px]" : "w-[85vw] sm:w-[320px] lg:w-[350px]"
      }`}
    >
      {/* Sponsored Badge */}
      <div className="absolute top-3 left-3 z-10 bg-black/80 text-kalahari border border-kalahari/50 font-black px-2 py-1 rounded text-[10px] flex items-center shadow-md uppercase tracking-widest backdrop-blur-md">
        <Megaphone className="h-3 w-3 mr-1" /> Sponsored
      </div>

      {/* Banner Image */}
      <div className={`relative w-full shrink-0 bg-black/50 border-b-2 border-kalahari/20 overflow-hidden flex items-center justify-center ${isCompact ? "h-48" : "h-56"}`}>
        {/* CRASH FIX: URL Validation */}
        {(ad.imageUrl && (ad.imageUrl.startsWith('http') || ad.imageUrl.startsWith('/'))) ? (
          <Image src={ad.imageUrl} alt={ad.advertiserName} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="text-kalahari/50 font-black uppercase text-2xl tracking-widest px-4 text-center">
            {ad.advertiserName}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow justify-center bg-gradient-to-b from-black/60 to-black/90">
        <h3 className="text-lg font-bold font-headline text-white group-hover:text-kalahari transition-colors mb-2">
          {ad.advertiserName}
        </h3>
        <p className="text-xs text-off-white/70 line-clamp-2 mb-4 font-bold">
          Click to view exclusive gear and offers for the Only-Hunts community.
        </p>
        
        <div className="mt-auto pt-4 border-t border-kalahari/20 flex justify-between items-center">
          <span className="text-kalahari text-[10px] font-black uppercase tracking-widest">Visit Sponsor</span>
          <ExternalLink className="h-4 w-4 text-kalahari group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </div>
      </div>
    </a>
  );
}