import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ShieldCheck, User, Award } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface HuntCardProps {
  hunt: any;
}

export default function HuntCard({ hunt }: HuntCardProps) {
  const displayPrice = hunt.price || hunt.basePrice;
  const displayLocation = hunt.location || hunt.province || "South Africa";

  return (
    <Link href={`/hunts/${hunt.id}`} className="group">
      <Card className="h-full overflow-hidden border-kalahari/20 hover:border-kalahari transition-all duration-300 shadow-sm hover:shadow-md bg-white">
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={hunt.imageUrl || "/api/placeholder/400/300"}
            alt={hunt.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {hunt.isVerified && (
            <div className="absolute top-2 left-2 bg-olive text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-lg">
              <ShieldCheck size={12} /> VERIFIED
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex items-center gap-1 text-olive dark:text-off-white/60 text-xs font-bold mb-2 uppercase tracking-tighter">
            <MapPin size={12} className="text-kalahari" />
            {displayLocation}
          </div>
          
          <h3 className="text-xl font-bold font-headline text-olive dark:text-off-white group-hover:text-kalahari transition-colors line-clamp-1 mb-1">
            {hunt.title}
          </h3>

          {/* --- UPDATED: OUTFITTER NAME SECTION WITH PREMIUM BADGE --- */}
          <div className="flex items-center gap-2 mb-4">
            {hunt.outfitterIsPremium ? (
              <div className="p-1 bg-amber-500/10 rounded-full border border-amber-500/30 shadow-sm">
                <Award size={14} className="text-amber-500" />
              </div>
            ) : (
              <div className="p-1 bg-kalahari/10 rounded-full">
                <User size={12} className="text-olive dark:text-off-white/70" />
              </div>
            )}
            
            <span className={`text-sm ${hunt.outfitterIsPremium ? 'font-black text-amber-600 dark:text-amber-400' : 'font-medium text-olive dark:text-off-white/70'}`}>
              {hunt.outfitterName || "Professional Outfitter"}
            </span>

            {hunt.outfitterIsPremium && (
               <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-500/20 px-1.5 py-0.5 rounded shadow-sm">
                 Premium
               </span>
            )}
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-olive dark:text-off-white/50">$</span>
            <span className="text-2xl font-black text-olive dark:text-off-white">
              {displayPrice ? displayPrice.toLocaleString() : "Contact"}
            </span>
            {hunt.duration && (
              <span className="text-xs font-bold text-olive dark:text-off-white/40 ml-1">
                / {hunt.duration} DAYS
              </span>
            )}
          </div>
        </CardContent>

        <CardFooter className="px-4 pb-4 pt-0">
          <div className="w-full py-2 border-t border-kalahari/10 text-center text-xs font-black text-kalahari uppercase tracking-widest group-hover:bg-kalahari group-hover:text-white transition-colors duration-300 rounded">
            View Expedition
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}