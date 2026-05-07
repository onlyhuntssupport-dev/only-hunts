"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Target, MessageSquare, Bookmark, ArrowRight, Tag, FileText } from "lucide-react";

interface MetricsGridProps {
  activeInquiriesCount: number;
  wishlistCount: number;
  offersCount: number;
  unreadOffersCount: number;
  pendingQuotesCount: number;
  onScrollToOffers: () => void;
}

export default function MetricsGrid({
  activeInquiriesCount,
  wishlistCount,
  offersCount,
  unreadOffersCount,
  pendingQuotesCount,
  onScrollToOffers
}: MetricsGridProps) {
  return (
    <div className="space-y-6 w-full">
      {/* Primary Action Card (Quotes) */}
      <Link href="/hunter/dashboard/quotes" className="block w-full">
        <div className="relative overflow-hidden rounded-2xl border-2 border-orange-500 bg-white/95 dark:bg-gray-900/90 backdrop-blur-md p-6 shadow-lg transition-all hover:border-orange-400 hover:shadow-orange-500/20 group cursor-pointer">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl transition-all group-hover:bg-orange-500/20"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center shrink-0 border border-orange-500/30">
                <FileText className="h-7 w-7 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white drop-shadow-sm">Custom Safari Inbox</h3>
                <p className="text-sm font-bold text-slate-600 dark:text-gray-300">Review quotes drafted exclusively for you.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`${pendingQuotesCount > 0 ? 'bg-orange-600 text-white animate-pulse' : 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300'} text-xs font-black px-3 py-1.5 rounded-full shadow-sm transition-colors`}>
                {pendingQuotesCount} Pending
              </span>
              <ArrowRight className="h-5 w-5 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
            </div>
          </div>
        </div>
      </Link>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Link href="/messages" className="block outline-none focus-visible:ring-2 focus-visible:ring-kalahari rounded-2xl">
          <Card className="border-2 border-kalahari/20 dark:border-kalahari/40 shadow-lg rounded-2xl overflow-hidden hover:border-kalahari dark:hover:border-kalahari bg-white/90 dark:bg-black/50 backdrop-blur-md transition-all group cursor-pointer h-full">
            <div className="p-6 flex items-center justify-between h-full">
              <div>
                <p className="text-sm font-bold text-olive/80 dark:text-off-white/70 uppercase tracking-widest mb-1 group-hover:text-olive dark:group-hover:text-off-white transition-colors">Inbox</p>
                <p className="text-2xl font-black text-olive dark:text-off-white transition-colors">Messages</p>
              </div>
              <div className="h-16 w-16 bg-kalahari/10 dark:bg-kalahari/20 rounded-full flex items-center justify-center group-hover:bg-kalahari/30 transition-colors">
                <MessageSquare className="h-8 w-8 text-kalahari group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Links to the standalone Bookings Page */}
        <Link href="/hunter/dashboard/bookings" className="block outline-none focus-visible:ring-2 focus-visible:ring-kalahari rounded-2xl cursor-pointer">
          <Card className="border-2 border-kalahari/20 dark:border-kalahari/40 shadow-lg rounded-2xl overflow-hidden hover:border-kalahari dark:hover:border-kalahari bg-white/90 dark:bg-black/50 backdrop-blur-md transition-all group h-full">
            <div className="p-6 flex items-center justify-between h-full">
              <div>
                <p className="text-sm font-bold text-olive/80 dark:text-off-white/70 uppercase tracking-widest mb-1 group-hover:text-olive dark:group-hover:text-off-white transition-colors">Active Inquiries</p>
                <p className="text-4xl font-black text-olive dark:text-off-white transition-colors">{activeInquiriesCount}</p>
              </div>
              <div className="h-16 w-16 bg-kalahari/10 dark:bg-kalahari/20 rounded-full flex items-center justify-center group-hover:bg-kalahari/30 transition-colors">
                <Target className="h-8 w-8 text-kalahari group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </Card>
        </Link>
        
        <Link href="/hunter/dashboard/wishlist" className="block outline-none focus-visible:ring-2 focus-visible:ring-kalahari rounded-2xl">
          <Card className="border-2 border-kalahari/20 dark:border-kalahari/40 shadow-lg rounded-2xl overflow-hidden hover:border-kalahari dark:hover:border-kalahari bg-white/90 dark:bg-black/50 backdrop-blur-md transition-all group cursor-pointer h-full">
            <div className="p-6 flex items-center justify-between h-full">
              <div>
                <p className="text-sm font-bold text-olive/80 dark:text-off-white/70 uppercase tracking-widest mb-1 group-hover:text-olive dark:group-hover:text-off-white transition-colors">Saved Hunts</p>
                <p className="text-4xl font-black text-olive dark:text-off-white transition-colors">{wishlistCount}</p>
              </div>
              <div className="h-16 w-16 bg-kalahari/10 dark:bg-kalahari/20 rounded-full flex items-center justify-center group-hover:bg-kalahari/30 transition-colors">
                <Bookmark className="h-8 w-8 text-kalahari group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </Card>
        </Link>

        <div onClick={onScrollToOffers} className="block outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-2xl cursor-pointer">
          <Card className={`border-2 shadow-lg rounded-2xl overflow-hidden transition-all group h-full backdrop-blur-md ${unreadOffersCount > 0 ? 'border-orange-400 dark:border-orange-500 bg-orange-50/90 dark:bg-orange-900/60' : 'border-kalahari/20 dark:border-kalahari/40 hover:border-kalahari bg-white/90 dark:bg-black/50'}`}>
            <div className="p-6 flex items-center justify-between h-full">
              <div>
                <p className={`text-sm font-bold uppercase tracking-widest mb-1 transition-colors ${unreadOffersCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-olive/80 dark:text-off-white/70 group-hover:text-olive dark:group-hover:text-off-white'}`}>
                  Exclusive Offers
                </p>
                <div className="flex items-center gap-3">
                  <p className={`text-4xl font-black transition-colors ${unreadOffersCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-olive dark:text-off-white'}`}>
                    {offersCount}
                  </p>
                  {unreadOffersCount > 0 && (
                    <span className="bg-orange-600 text-white text-xs font-black px-2 py-1 rounded-full animate-pulse shadow-sm">
                      {unreadOffersCount} NEW
                    </span>
                  )}
                </div>
              </div>
              <div className={`h-16 w-16 rounded-full flex items-center justify-center transition-colors ${unreadOffersCount > 0 ? 'bg-orange-200 dark:bg-orange-900/60' : 'bg-kalahari/10 dark:bg-kalahari/20 group-hover:bg-kalahari/30'}`}>
                <Tag className={`h-8 w-8 group-hover:scale-110 transition-transform ${unreadOffersCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-kalahari'}`} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}