"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth, db } from "@/lib/firebase/client";
import { doc, updateDoc } from "firebase/firestore";
import { User, Camera, ArrowLeft, CheckCircle } from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";

// Import Server Actions
import { fetchHunterDashboardData } from "@/app/actions/hunterDashboard";

// Import new Presentational Components
import MetricsGrid from "@/components/hunter/MetricsGrid";
import OffersList, { Offer } from "@/components/hunter/OffersList";

interface Inquiry {
  id: string;
  status: string;
}

export default function HunterDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [pendingQuotesCount, setPendingQuotesCount] = useState(0);
  
  const [hunterName, setHunterName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const loadDashboardData = async (uid: string) => {
    try {
      const data = await fetchHunterDashboardData(uid);
      
      setHunterName(data.hunterName);
      setProfileImage(data.profileImage);
      setPendingQuotesCount(data.pendingQuotesCount);
      setWishlistCount(data.wishlistCount);
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

  if (loading) {
    return <KuduLoader />;
  }

  const activeInquiriesCount = inquiries.filter(i => i.status !== "ARCHIVED" && i.status !== "LOST").length;
  const unreadOffersCount = offers.filter(o => o.status === "UNREAD").length;

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      
      {/* Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <Image
          src="/hunter-bg.jpg" 
          alt="Hunter scanning the Limpopo Valley"
          fill
          quality={100}
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-olive/80 dark:bg-black/60 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto space-y-8 w-full flex-1">
        
        {/* Header */}
        <div className="bg-white/90 dark:bg-black/40 backdrop-blur-md border border-kalahari/20 dark:border-kalahari/40 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6 transition-colors">
          <Link href="/hunter/dashboard/settings" className="relative group shrink-0">
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

        {/* Presentational Component: Metrics Grid */}
        <MetricsGrid 
          activeInquiriesCount={activeInquiriesCount}
          wishlistCount={wishlistCount}
          offersCount={offers.length}
          unreadOffersCount={unreadOffersCount}
          pendingQuotesCount={pendingQuotesCount}
          onScrollToOffers={() => scrollToSection('offers')}
        />

        {/* Presentational Component: Offers List */}
        <OffersList 
          offers={offers}
          onMarkRead={markOfferAsRead}
          onDismiss={handleDismissOffer}
        />

        {/* Footer Link */}
        <div className="pt-4 flex justify-center pb-8">
          <Link href="/" className="inline-flex items-center font-bold text-olive/80 dark:text-off-white/80 hover:text-kalahari transition-colors border-b-2 border-transparent hover:border-kalahari pb-1 bg-white/50 dark:bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}