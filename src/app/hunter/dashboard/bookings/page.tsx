"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase/client";
import { doc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Target, Clock, CheckCircle, MessageSquare, User, ArrowLeft, Trash2, Star, Compass } from "lucide-react";
import MilestoneReviewModal from "@/components/marketplace/MilestoneReviewModal";
import KuduLoader from "@/components/ui/KuduLoader";
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

export default function BookingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [reviewStatuses, setReviewStatuses] = useState<Record<string, any>>({});
  
  const [activeReviewInquiry, setActiveReviewInquiry] = useState<Inquiry | null>(null);
  const [activeMilestone, setActiveMilestone] = useState<1 | 2 | 3>(1);

  const loadDashboardData = async (uid: string) => {
    try {
      const data = await fetchHunterDashboardData(uid);
      setReviewStatuses(data.reviewStatuses);
      setInquiries(data.inquiries as Inquiry[]);
    } catch (err) {
      console.error("Bookings load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const handleArchiveInquiry = async (inquiryId: string) => {
    if (!window.confirm("Are you sure you want to remove this request from your view?")) return;
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

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-stone-50 dark:bg-stone-950">
      <div className="relative z-10 p-4 md:p-8 max-w-5xl mx-auto space-y-8 w-full flex-1">
        
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/hunter/dashboard" className="p-2 bg-white dark:bg-black/40 rounded-full border border-kalahari/20 hover:bg-kalahari/10 transition-colors">
            <ArrowLeft className="h-6 w-6 text-olive dark:text-off-white" />
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-black font-headline text-olive dark:text-off-white tracking-tight flex items-center gap-3">
              <Target className="h-8 w-8 text-kalahari" /> My Bookings
            </h1>
            <p className="text-olive/80 dark:text-off-white/80 mt-1 font-medium">
              Manage your active safari requests and confirmed hunts.
            </p>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white/95 dark:bg-black/60 backdrop-blur-md border-2 border-kalahari/20 dark:border-kalahari/40 rounded-2xl p-6 md:p-8 shadow-xl min-h-[500px]">
          {activeInquiries.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-kalahari/30 rounded-xl flex flex-col items-center justify-center">
              <Compass className="mx-auto h-16 w-16 text-kalahari/60 mb-4" />
              <h3 className="text-2xl font-black text-olive dark:text-off-white">No active bookings</h3>
              <p className="text-olive/80 dark:text-off-white/70 mt-2 mb-6 max-w-md mx-auto">
                You haven't requested any dates yet. Explore the marketplace to find your next adventure.
              </p>
              <Button asChild className="bg-olive dark:bg-kalahari text-kalahari dark:text-olive font-black h-12 px-8 rounded-xl">
                <Link href="/marketplace">Browse Hunts</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {activeInquiries.map((inquiry) => {
                const reviewData = reviewStatuses[inquiry.id];
                const isBooked = inquiry.status === "BOOKED";
                
                let nextMilestone: 1 | 2 | 3 | null = null;
                if (isBooked) {
                  if (!reviewData?.milestone1) nextMilestone = 1;
                  else if (!reviewData?.milestone2) nextMilestone = 2;
                  else if (!reviewData?.milestone3) nextMilestone = 3;
                }

                return (
                  <div key={inquiry.id} className="border-2 border-kalahari/20 dark:border-kalahari/40 bg-stone-50/50 dark:bg-black/40 rounded-xl p-6 hover:border-kalahari/60 transition-colors flex flex-col md:flex-row gap-6 shadow-sm">
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4 border-b border-kalahari/10 dark:border-kalahari/30 pb-4">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-kalahari/20 border-2 border-kalahari/50 shrink-0 flex items-center justify-center">
                          {inquiry.outfitterLogo ? (
                            <img src={inquiry.outfitterLogo} alt={inquiry.outfitterName} className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-5 w-5 text-olive dark:text-off-white/80" />
                          )}
                        </div>
                        <span className="text-kalahari text-sm font-black uppercase tracking-widest truncate">
                          {inquiry.outfitterName}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        {inquiry.status === "NEW" && (
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black px-3 py-1 rounded flex items-center gap-1 uppercase tracking-wider">
                            <Clock className="h-4 w-4" /> Request Sent
                          </span>
                        )}
                        {inquiry.status === "REVIEWED" && (
                          <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs font-black px-3 py-1 rounded flex items-center gap-1 uppercase tracking-wider">
                            <MessageSquare className="h-4 w-4" /> Outfitter Reviewing
                          </span>
                        )}
                        {inquiry.status === "BOOKED" && (
                          <span className="bg-green-100 text-green-800 border border-green-200 text-xs font-black px-3 py-1 rounded flex items-center gap-1 uppercase tracking-wider">
                            <CheckCircle className="h-4 w-4" /> Confirmed Booking
                          </span>
                        )}
                        <span className="text-xs font-bold text-olive/70 dark:text-off-white/60">
                          Requested on {new Date(inquiry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h3 className="text-2xl font-bold font-headline text-olive dark:text-off-white leading-tight mb-2">
                        {inquiry.huntTitle}
                      </h3>
                      
                      {isBooked && (
                        <div className="mt-4 bg-white dark:bg-black/30 p-3 rounded-lg border border-kalahari/10 inline-flex items-center gap-3 text-xs font-bold flex-wrap">
                          <span className={reviewData?.milestone1 ? "text-kalahari" : "text-olive/50 dark:text-off-white/40"}>M1: Booking Secured</span>
                          <span className="text-kalahari/40">•</span>
                          <span className={reviewData?.milestone2 ? "text-kalahari" : "text-olive/50 dark:text-off-white/40"}>M2: Safari Completed</span>
                          <span className="text-kalahari/40">•</span>
                          <span className={reviewData?.milestone3 ? "text-kalahari" : "text-olive/50 dark:text-off-white/40"}>M3: Trophies Delivered</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 md:w-48 justify-end border-t md:border-t-0 md:border-l border-kalahari/10 dark:border-kalahari/30 pt-4 md:pt-0 md:pl-6">
                      {isBooked && nextMilestone !== null && (
                        <Button 
                          onClick={() => openReviewModal(inquiry, nextMilestone as 1|2|3)}
                          className="bg-kalahari hover:bg-kalahari/90 text-white font-bold w-full h-12"
                        >
                          <Star className="h-4 w-4 mr-2" /> Rate Phase {nextMilestone}
                        </Button>
                      )}

                      {isBooked && nextMilestone === null && (
                        <div className="text-xs font-bold text-green-700 dark:text-green-400 flex items-center justify-center gap-1 bg-green-50 dark:bg-green-900/30 px-3 py-3 rounded-xl border border-green-200 dark:border-green-800/60 h-12">
                          <CheckCircle className="h-4 w-4" /> Journey Complete
                        </div>
                      )}

                      <Link href={`/hunts/${inquiry.huntId}`} className="w-full">
                        <Button variant="outline" className="border-kalahari/40 text-olive dark:text-off-white hover:bg-kalahari/10 font-bold w-full h-12">
                          View Hunt Details
                        </Button>
                      </Link>

                      <Button 
                        variant="ghost" 
                        onClick={() => handleArchiveInquiry(inquiry.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/40 w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Hide Request
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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