"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Tag, Trash2, Flame } from "lucide-react";

export interface Offer {
  id: string;
  outfitterId: string;
  huntId: string;
  huntTitle: string;
  message: string;
  status: string;
  createdAt: string;
  outfitterName?: string;
  outfitterLogo?: string;
}

interface OffersListProps {
  offers: Offer[];
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

export default function OffersList({ offers, onMarkRead, onDismiss }: OffersListProps) {
  return (
    <div className="w-full">
      <div className="bg-white/95 dark:bg-black/60 backdrop-blur-md border-2 border-orange-200 dark:border-orange-900/60 rounded-2xl p-6 shadow-xl relative overflow-hidden h-full flex flex-col transition-colors">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-kalahari"></div>
        <h2 id="offers" className="text-xl font-black font-headline text-slate-900 dark:text-off-white mb-6 flex items-center gap-3 scroll-mt-24">
          <Flame className="h-6 w-6 text-orange-500" /> Exclusive Outfitter Deals
        </h2>

        <div className="flex-1">
          {offers.length === 0 ? (
            <div className="text-center py-12 bg-orange-50/50 dark:bg-black/30 border-2 border-dashed border-orange-200 dark:border-orange-900/40 rounded-xl h-full flex flex-col items-center justify-center">
              <Tag className="mx-auto h-10 w-10 text-orange-300 dark:text-orange-700/60 mb-3" />
              <p className="text-orange-800/80 dark:text-off-white/70 font-bold">No exclusive deals right now.</p>
              <p className="text-orange-800/60 dark:text-off-white/50 text-sm mt-1">Outfitters will send offers here when you save hunts.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map((offer) => (
                <div 
                  key={offer.id} 
                  className={`border-2 rounded-xl p-5 flex flex-col gap-4 transition-all relative ${
                    offer.status === 'UNREAD' 
                    ? 'border-orange-300 dark:border-orange-500/70 bg-orange-50/90 dark:bg-orange-900/40 shadow-md' 
                    : 'border-slate-200 dark:border-kalahari/30 bg-slate-50/80 dark:bg-black/50'
                  }`}
                >
                  {offer.status === 'UNREAD' && (
                    <div className="absolute -top-2 -right-2">
                      <span className="flex h-5 w-5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-orange-500 border-2 border-white dark:border-black"></span>
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-full overflow-hidden bg-orange-200 border border-orange-300 shrink-0 flex items-center justify-center">
                        {offer.outfitterLogo ? (
                          <img src={offer.outfitterLogo} alt={offer.outfitterName} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-3 w-3 text-orange-700/60" />
                        )}
                      </div>
                      <span className="text-orange-800 dark:text-orange-400 text-xs font-black uppercase tracking-widest truncate">
                        {offer.outfitterName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-700/70 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                        <Tag className="h-3 w-3" /> Deal
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-off-white/70">
                        {new Date(offer.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold font-headline text-slate-900 dark:text-off-white leading-tight mb-2">
                      {offer.huntTitle}
                    </h3>
                    
                    <div className="bg-white/70 dark:bg-black/40 border border-orange-100 dark:border-orange-900/40 p-3 rounded-lg text-slate-700 dark:text-off-white/90 text-sm font-medium whitespace-pre-wrap leading-relaxed">
                      "{offer.message}"
                    </div>
                  </div>

                  <div className="flex flex-col xl:flex-row gap-2 mt-auto pt-2">
                    <Link href={`/hunts/${offer.huntId}`} className="flex-1">
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold">
                        View Package
                      </Button>
                    </Link>
                    
                    {offer.status === 'UNREAD' && (
                      <Button 
                        variant="outline" 
                        onClick={() => onMarkRead(offer.id)}
                        className="flex-1 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-off-white hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                      >
                        Mark Read
                      </Button>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      onClick={() => onDismiss(offer.id)}
                      className="px-3 text-slate-500 dark:text-off-white/60 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40"
                      title="Dismiss Offer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}