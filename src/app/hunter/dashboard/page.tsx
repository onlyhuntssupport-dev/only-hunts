"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth, db } from "@/lib/firebase/client";
import { doc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, Compass, Clock, CheckCircle, Bookmark, ArrowRight, MessageSquare, Star, User, Camera, Flame, Tag, ArrowLeft, Trash2, FileText } from "lucide-react";
import MilestoneReviewModal from "@/components/marketplace/MilestoneReviewModal";
import KuduLoader from "@/components/ui/KuduLoader";

// Import the optimized server action
import { fetchHunterDashboardData } from "@/app/actions/hunterDashboard";

interface Inquiry {
  id: string;
  huntId: string;
  huntTitle: string;
  outfitterId: string;
  status: string;
  createdAt: string;
  hunterArchived?: boolean;
  outfitterName?: string;
  outfitterLogo?: string;
}

interface Offer {
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

export default function HunterDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reviewStatuses, setReviewStatuses] = useState<Record<string, any>>({});
  const [wishlistCount, setWishlistCount] = useState(0);
  const [pendingQuotesCount, setPendingQuotesCount] = useState(0);
  
  const [hunterName, setHunterName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const [activeReviewInquiry, setActiveReviewInquiry] = useState<Inquiry | null>(null);
  const [activeMilestone, setActiveMilestone] = useState<1 | 2 | 3>(1);

  // Optimized data loader
  const loadDashboardData = async (uid: string) => {
    try {
      const data = await fetchHunterDashboardData(uid);
      
      setHunterName(data.hunterName);
      setProfileImage(data.profileImage);
      setPendingQuotesCount(data.pendingQuotesCount);
      setWishlistCount(data.wishlistCount);
      setReviewStatuses(data.reviewStatuses);
      setInquiries(data.inquiries as Inquiry[]);
      setOffers(data.offers as Offer[]);
    } catch (err) {
      console.error("Dashboard refresh failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("success") === "profile") {
        setShowSuccessBanner(true);
        window.history.replaceState(null, "", window.location.pathname);
        setTimeout(() => setShowSuccessBanner(false), 5000);
      }
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadDashboardData(user.uid);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const openReviewModal = (inquiry: Inquiry, milestone: 1 | 2 | 3) => {
    setActiveReviewInquiry(inquiry);
    setActiveMilestone(milestone);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const markOfferAsRead = async (offerId: string) => {
    try {
      const offerRef = doc(db, "offers", offerId);
      await updateDoc(offerRef, { status: "READ" });
      setOffers(offers.map(o => o.id === offerId ? { ...o, status: "READ" } : o));
    } catch (err) {
      console.error("Error marking offer as read:", err);
    }
  };

  const handleDismissOffer = async (offerId: string) => {
    if (!window.confirm("Are you sure you want to dismiss this deal?")) return;
    try {
      await updateDoc(doc(db, "offers", offerId), { status: "DISMISSED" });
      setOffers(prev => prev.filter(o => o.id !== offerId)); 
    } catch (err) {
      console.error("Error dismissing offer:", err);
    }
  };

  const handleArchiveInquiry = async (inquiryId: string) => {
    if (!window.confirm("Are you sure you want to remove this request?")) return;
    try {
      await updateDoc(doc(db, "inquiries", inquiryId), { hunterArchived: true });
      setInquiries(prev => prev.filter(i => i.id !== inquiryId)); 
    } catch (err) {
      console.error("Error archiving inquiry:", err);
    }
  };

  if (loading) {
    return <KuduLoader />;
  }

  const activeInquiries = inquiries.filter(i => i.status !== "ARCHIVED" && i.status !== "LOST");
  const unreadOffers = offers.filter(o => o.status === "UNREAD");

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      
      {/* SCOPED BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <Image
          src="/hunter-bg.jpg" 
          alt="Hunter scanning the Limpopo Valley"
          fill
          quality={100}
          priority
          className="object-cover object-center"
        />
        {/* Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-olive/80 dark:bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* DASHBOARD CONTENT */}
      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto space-y-8 w-full flex-1">
        
        {/* Clean Dashboard Header */}
        <div className="bg-white/90 dark:bg-black/40 backdrop-blur-md border border-kalahari/20 dark:border-kalahari/40 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6 transition-colors">
          <Link href="/profile/edit" className="relative group shrink-0">
            <div className="h-20 w-20 md:h-24 md:w-24 bg-kalahari/10 border-2 border-kalahari/50 rounded-full overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
              {profileImage ? (
                <img src={profileImage} alt={hunterName} className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-kalahari/50" />
              )}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </Link>

          <div className="text-center md:text-left pt-2 flex-1">
            <h1 className="text-3xl md:text-4xl font-black font-headline text-olive dark:text-off-white tracking-tight drop-shadow-sm">
              Hunter Basecamp
            </h1>
            <p className="text-olive/80 dark:text-off-white/80 mt-1 text-lg font-medium transition-colors">
              Welcome back, {hunterName}. Track your booking requests and exclusive deals.
            </p>
          </div>
        </div>

        {showSuccessBanner && (
          <div className="bg-green-50 dark:bg-green-900/50 border-2 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 p-4 rounded-xl shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 transition-colors backdrop-blur-md">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
            <span className="font-bold text-lg">Profile updated.</span>
          </div>
        )}

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

          <div onClick={() => scrollToSection('inquiries')} className="block outline-none focus-visible:ring-2 focus-visible:ring-kalahari rounded-2xl cursor-pointer">
            <Card className="border-2 border-kalahari/20 dark:border-kalahari/40 shadow-lg rounded-2xl overflow-hidden hover:border-kalahari dark:hover:border-kalahari bg-white/90 dark:bg-black/50 backdrop-blur-md transition-all group h-full">
              <div className="p-6 flex items-center justify-between h-full">
                <div>
                  <p className="text-sm font-bold text-olive/80 dark:text-off-white/70 uppercase tracking-widest mb-1 group-hover:text-olive dark:group-hover:text-off-white transition-colors">Active Inquiries</p>
                  <p className="text-4xl font-black text-olive dark:text-off-white transition-colors">{activeInquiries.length}</p>
                </div>
                <div className="h-16 w-16 bg-kalahari/10 dark:bg-kalahari/20 rounded-full flex items-center justify-center group-hover:bg-kalahari/30 transition-colors">
                  <Target className="h-8 w-8 text-kalahari group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </Card>
          </div>
          
          <Link href="/hunter/wishlist" className="block outline-none focus-visible:ring-2 focus-visible:ring-kalahari rounded-2xl">
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

          <div onClick={() => scrollToSection('offers')} className="block outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-2xl cursor-pointer">
            <Card className={`border-2 shadow-lg rounded-2xl overflow-hidden transition-all group h-full backdrop-blur-md ${unreadOffers.length > 0 ? 'border-orange-400 dark:border-orange-500 bg-orange-50/90 dark:bg-orange-900/60' : 'border-kalahari/20 dark:border-kalahari/40 hover:border-kalahari bg-white/90 dark:bg-black/50'}`}>
              <div className="p-6 flex items-center justify-between h-full">
                <div>
                  <p className={`text-sm font-bold uppercase tracking-widest mb-1 transition-colors ${unreadOffers.length > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-olive/80 dark:text-off-white/70 group-hover:text-olive dark:group-hover:text-off-white'}`}>
                    Exclusive Offers
                  </p>
                  <div className="flex items-center gap-3">
                    <p className={`text-4xl font-black transition-colors ${unreadOffers.length > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-olive dark:text-off-white'}`}>
                      {offers.length}
                    </p>
                    {unreadOffers.length > 0 && (
                      <span className="bg-orange-600 text-white text-xs font-black px-2 py-1 rounded-full animate-pulse shadow-sm">
                        {unreadOffers.length} NEW
                      </span>
                    )}
                  </div>
                </div>
                <div className={`h-16 w-16 rounded-full flex items-center justify-center transition-colors ${unreadOffers.length > 0 ? 'bg-orange-200 dark:bg-orange-900/60' : 'bg-kalahari/10 dark:bg-kalahari/20 group-hover:bg-kalahari/30'}`}>
                  <Tag className={`h-8 w-8 group-hover:scale-110 transition-transform ${unreadOffers.length > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-kalahari'}`} />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Main Content Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
          
          {/* Offers Section */}
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
                <div className="space-y-4">
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

                      <div className="flex flex-col sm:flex-row gap-2 mt-auto pt-2">
                        <Link href={`/hunts/${offer.huntId}`} className="flex-1">
                          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold">
                            View Package
                          </Button>
                        </Link>
                        
                        {offer.status === 'UNREAD' && (
                          <Button 
                            variant="outline" 
                            onClick={() => markOfferAsRead(offer.id)}
                            className="flex-1 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-off-white hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                          >
                            Mark Read
                          </Button>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          onClick={() => handleDismissOffer(offer.id)}
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

          {/* Inquiries Section */}
          <div className="bg-white/95 dark:bg-black/60 backdrop-blur-md border-2 border-kalahari/20 dark:border-kalahari/40 rounded-2xl p-6 shadow-xl h-full flex flex-col transition-colors">
            <h2 id="inquiries" className="text-xl font-black font-headline text-olive dark:text-off-white mb-6 flex items-center gap-3 scroll-mt-24">
              <Target className="h-6 w-6 text-kalahari" /> Your Booking Requests
            </h2>

            <div className="flex-1">
              {inquiries.length === 0 ? (
                <div className="text-center py-12 bg-off-white/50 dark:bg-black/30 border-2 border-dashed border-kalahari/30 dark:border-kalahari/40 rounded-xl h-full flex flex-col items-center justify-center">
                  <Compass className="mx-auto h-10 w-10 text-kalahari/60 mb-3" />
                  <h3 className="text-lg font-bold text-olive dark:text-off-white">No inquiries yet</h3>
                  <p className="text-olive/80 dark:text-off-white/70 text-sm mt-1">Request dates on the marketplace to start your journey.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map((inquiry) => {
                    const reviewData = reviewStatuses[inquiry.id];
                    const isBooked = inquiry.status === "BOOKED";
                    
                    let nextMilestone: 1 | 2 | 3 | null = null;
                    if (isBooked) {
                      if (!reviewData?.milestone1) nextMilestone = 1;
                      else if (!reviewData?.milestone2) nextMilestone = 2;
                      else if (!reviewData?.milestone3) nextMilestone = 3;
                    }

                    return (
                      <div key={inquiry.id} className="border-2 border-kalahari/20 dark:border-kalahari/40 bg-white/90 dark:bg-black/50 rounded-xl p-5 hover:border-kalahari/60 transition-colors flex flex-col gap-4 shadow-sm">
                        
                        <div>
                          <div className="flex items-center gap-2.5 mb-3 border-b border-kalahari/10 dark:border-kalahari/30 pb-3">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-kalahari/20 border border-kalahari/50 shrink-0 flex items-center justify-center">
                              {inquiry.outfitterLogo ? (
                                <img src={inquiry.outfitterLogo} alt={inquiry.outfitterName} className="h-full w-full object-cover" />
                              ) : (
                                <User className="h-4 w-4 text-olive dark:text-off-white/80" />
                              )}
                            </div>
                            <span className="text-kalahari text-xs font-black uppercase tracking-widest truncate">
                              {inquiry.outfitterName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {inquiry.status === "NEW" && (
                              <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/60 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                                <Clock className="h-3 w-3" /> Sent
                              </span>
                            )}
                            {inquiry.status === "REVIEWED" && (
                              <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700/60 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                                <MessageSquare className="h-3 w-3" /> Under Review
                              </span>
                            )}
                            {inquiry.status === "BOOKED" && (
                              <span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700/60 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                                <CheckCircle className="h-3 w-3" /> Booked
                              </span>
                            )}
                            <span className="text-[11px] font-bold text-olive/70 dark:text-off-white/60">
                              {new Date(inquiry.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <h3 className="text-lg font-bold font-headline text-olive dark:text-off-white leading-tight mb-1">
                            {inquiry.huntTitle}
                          </h3>
                          
                          {isBooked && (
                            <div className="mt-2 flex items-center gap-2 text-[11px] font-bold flex-wrap">
                              <span className={reviewData?.milestone1 ? "text-kalahari" : "text-olive/50 dark:text-off-white/40"}>M1: Booking</span>
                              <span className="text-kalahari/40">•</span>
                              <span className={reviewData?.milestone2 ? "text-kalahari" : "text-olive/50 dark:text-off-white/40"}>M2: Safari</span>
                              <span className="text-kalahari/40">•</span>
                              <span className={reviewData?.milestone3 ? "text-kalahari" : "text-olive/50 dark:text-off-white/40"}>M3: Trophies</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-2 mt-auto pt-2 border-t border-kalahari/10 dark:border-kalahari/30">
                          {isBooked && nextMilestone !== null && (
                            <Button 
                              onClick={() => openReviewModal(inquiry, nextMilestone as 1|2|3)}
                              className="bg-kalahari hover:bg-kalahari/90 text-white font-bold w-full sm:flex-1"
                            >
                              <Star className="h-4 w-4 mr-1.5" /> Rate Phase {nextMilestone}
                            </Button>
                          )}

                          {isBooked && nextMilestone === null && (
                            <span className="flex-1 text-xs font-bold text-green-700 dark:text-green-400 flex items-center justify-center gap-1 bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800/60">
                              <CheckCircle className="h-4 w-4" /> Journey Complete
                            </span>
                          )}

                          <Link href={`/hunts/${inquiry.huntId}`} className={isBooked && nextMilestone !== null ? "w-full sm:w-auto" : "w-full sm:flex-1"}>
                            <Button variant="outline" className="border-kalahari/40 dark:border-kalahari/60 text-olive dark:text-off-white hover:bg-kalahari/10 font-bold w-full">
                              View Package
                            </Button>
                          </Link>

                          <Button 
                            variant="ghost" 
                            onClick={() => handleArchiveInquiry(inquiry.id)}
                            className="px-3 text-olive/60 dark:text-off-white/50 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 w-full sm:w-auto"
                            title="Remove from Dashboard"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-center pb-8">
          <Link href="/" className="inline-flex items-center font-bold text-olive/80 dark:text-off-white/80 hover:text-kalahari transition-colors border-b-2 border-transparent hover:border-kalahari pb-1 bg-white/50 dark:bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Marketplace
          </Link>
        </div>
      </div>

      {activeReviewInquiry && (
        <MilestoneReviewModal
          isOpen={!!activeReviewInquiry}
          onClose={() => setActiveReviewInquiry(null)}
          inquiryId={activeReviewInquiry.id}
          outfitterId={activeReviewInquiry.outfitterId}
          hunterId={auth.currentUser?.uid || ""}
          milestoneNumber={activeMilestone}
          onSuccess={() => {
            if (auth.currentUser) loadDashboardData(auth.currentUser.uid);
          }} 
        />
      )}
    </div>
  );
}