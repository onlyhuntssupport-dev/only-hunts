"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation"; // <-- IMPORT PATHNAME
import { getEndorsements } from "@/app/actions/endorsements";

export default function EndorsementBanner() {
  const [activePartners, setActivePartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname(); // <-- GET CURRENT ROUTE

  useEffect(() => {
    let isMounted = true;

    const fetchPartners = async () => {
      try {
        const res = await getEndorsements();
        if (res.success && res.data && isMounted) {
          const partners = res.data
            .filter((partner: any) => partner.isActive)
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          setActivePartners(partners);
        }
      } catch (error) {
        console.error("Failed to load endorsements:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Only fetch if we are NOT on an admin or login page
    if (!pathname?.startsWith("/admin") && !pathname?.startsWith("/login")) {
      fetchPartners();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // SAFEGUARD: If on admin/login, loading, or no active partners, render nothing
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/login") || loading || activePartners.length === 0) {
    return null; 
  }

  return (
    <section className="w-full py-12 bg-black border-y border-kalahari/20 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[100px] bg-kalahari/5 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <p className="text-center text-[10px] font-black uppercase tracking-widest text-off-white/40 mb-8">
          Trusted By Industry Leaders & Conservation Partners
        </p>

        {/* Logo/Fallback Grid */}
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 opacity-90">
          {activePartners.map((partner: any) => {
            const isClickable = Boolean(partner.websiteUrl);

            const PartnerContent = () => (
              <div className="group relative flex items-center justify-center h-14 w-32 md:h-16 md:w-48 transition-all duration-300 hover:scale-105">
                {partner.logoUrl ? (
                  // Image Rendering (Grayscale until hover)
                  <Image
                    src={partner.logoUrl}
                    alt={partner.name || "Partner Logo"}
                    fill
                    className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500 opacity-50 group-hover:opacity-100"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  // Zero-Liability Text Fallback (Sleek UI Block)
                  <div className="w-full h-full flex items-center justify-center bg-white/5 border border-white/10 rounded-xl group-hover:border-kalahari/40 group-hover:bg-kalahari/10 transition-colors shadow-inner px-4">
                    <span className="text-[10px] md:text-xs font-black text-off-white/50 uppercase tracking-widest group-hover:text-kalahari transition-colors text-center line-clamp-2">
                      {partner.name || "Partner"}
                    </span>
                  </div>
                )}
              </div>
            );

            // Wrap in an anchor tag only if a website URL was provided
            if (isClickable) {
              return (
                <a
                  key={partner.id}
                  href={partner.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <PartnerContent />
                </a>
              );
            }

            return (
              <div key={partner.id}>
                <PartnerContent />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}