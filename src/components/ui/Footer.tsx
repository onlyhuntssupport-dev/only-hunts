"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, Twitter } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const handleExternalLink = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    e.preventDefault();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <footer className="bg-black/90 border-t-2 border-kalahari/20 pt-16 pb-8 mt-auto z-20 relative text-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Link href="/" className="mb-4">
              {/* ASPECT RATIO FIX: width 96 / 1.24 natural ratio = 77 height */}
              <Image 
                src="/logo-transparent.png" 
                alt="Only-Hunts Logo" 
                width={96} 
                height={77} 
                className="w-24 h-auto drop-shadow-[0_0_10px_rgba(209,164,123,0.3)]"
              />
            </Link>
            <p className="text-sm text-off-white/70 font-medium max-w-xs">
              The premier marketplace for verified South African safaris. Tell your story in the bushveld.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-kalahari font-black uppercase tracking-widest text-xs mb-6">Explore</h4>
            <nav className="flex flex-col space-y-3 text-sm font-bold">
              <Link href="/marketplace" className="hover:text-kalahari transition-colors">Marketplace</Link>
              <Link href="/outfitters" className="hover:text-kalahari transition-colors">Verified Outfitters</Link>
              <Link href="/specials" className="hover:text-kalahari transition-colors">Special Offers</Link>
              <Link href="/about" className="hover:text-kalahari transition-colors">About Us</Link>
            </nav>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-kalahari font-black uppercase tracking-widest text-xs mb-6">Connect</h4>
            
            <div className="flex space-x-4 mb-6">
              <a 
                href="https://x.com/Only_Hunts" 
                onClick={(e) => handleExternalLink(e, "https://x.com/Only_Hunts")}
                className="bg-black/50 p-3 rounded-full border border-kalahari/20 hover:border-kalahari hover:bg-kalahari/10 hover:text-kalahari transition-all group"
                aria-label="Follow us on X (Twitter)"
              >
                <Twitter className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>

              <a 
                href="https://www.instagram.com/onlyhunts1/" 
                onClick={(e) => handleExternalLink(e, "https://www.instagram.com/onlyhunts1/")}
                className="bg-black/50 p-3 rounded-full border border-kalahari/20 hover:border-kalahari hover:bg-kalahari/10 hover:text-kalahari transition-all group"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              
              <a 
                href="https://www.tiktok.com/@only_hunts" 
                onClick={(e) => handleExternalLink(e, "https://www.tiktok.com/@only_hunts")}
                className="bg-black/50 p-3 rounded-full border border-kalahari/20 hover:border-kalahari hover:bg-kalahari/10 hover:text-kalahari transition-all group"
                aria-label="Follow us on TikTok"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>

            <p className="text-sm text-off-white/60 font-medium">
              support@only-hunts.com
            </p>
          </div>

        </div>

        <div className="pt-8 border-t border-kalahari/10 flex flex-col md:flex-row justify-between items-center text-xs text-off-white/40 font-bold uppercase tracking-widest gap-4 mb-6">
          <p>&copy; {currentYear} Only-Hunts. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link 
              href="/legal" 
              className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] hover:text-orange-400 hover:drop-shadow-[0_0_12px_rgba(249,115,22,1)] transition-all"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/legal" 
              className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] hover:text-orange-400 hover:drop-shadow-[0_0_12px_rgba(249,115,22,1)] transition-all"
            >
              Terms of Service
            </Link>
          </div>
        </div>

        <div className="text-center pb-2">
          <p className="text-[10px] text-off-white/30 italic font-medium tracking-wide">
            *Conceptual imagery on this platform may include AI-generated or synthetic media.
          </p>
        </div>

      </div>
    </footer>
  );
}