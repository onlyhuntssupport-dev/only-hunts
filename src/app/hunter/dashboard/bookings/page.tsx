"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { CalendarCheck, MapPin, DollarSign, MessageSquare, Download, CheckCircle2, Compass, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import KuduLoader from "@/components/ui/KuduLoader";
import { generatePDFReceipt } from "@/lib/generateReceipt";

interface Booking {
  id: string;
  huntId: string;
  huntTitle: string;
  outfitterId: string;
  outfitterName: string;
  totalPriceUSD: number;
  depositPaidUSD: number;
  balanceDueUSD: number;
  status: string; // e.g., "DEPOSIT_SECURED", "COMPLETED"
  createdAt: any;
  coverImage?: string;
  location?: string;
}

export default function HunterBookingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    // Check for Paystack redirect success parameter
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("success") === "true") {
        setShowSuccessBanner(true);
        // Clean the URL so a refresh doesn't show the banner again
        window.history.replaceState(null, "", window.location.pathname);
        setTimeout(() => setShowSuccessBanner(false), 8000);
      }
    }

    const fetchBookings = async (uid: string) => {
      try {
        // Query the 'bookings' collection where this hunter is the owner
        const bookingsRef = collection(db, "bookings");
        const q = query(
          bookingsRef, 
          where("hunterId", "==", uid),
          // Note: You may need a Firestore index for this compound query
          // orderBy("createdAt", "desc") 
        );
        const querySnapshot = await getDocs(q);
        
        const fetchedBookings = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Booking[];
        
        // Fallback sort if index isn't created yet
        fetchedBookings.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || new Date(a.createdAt).getTime();
          const dateB = b.createdAt?.toMillis?.() || new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        setBookings(fetchedBookings);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchBookings(user.uid);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <KuduLoader />;
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col pb-24">
      {/* Background Styling */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-off-white dark:bg-olive transition-colors" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#F97316 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-6xl mx-auto space-y-8 w-full flex-1">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-kalahari/20 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black font-headline text-olive dark:text-off-white tracking-tight">
              My Bookings
            </h1>
            <p className="text-olive/70 dark:text-off-white/70 mt-2 text-lg font-medium">
              Manage your secured safaris and track remaining balances.
            </p>
          </div>
        </div>

        {/* Success Banner from Paystack */}
        {showSuccessBanner && (
          <div className="bg-green-50 dark:bg-green-900/40 border-2 border-green-500/50 p-6 rounded-2xl flex items-center justify-between shadow-lg animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 rounded-full p-2">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-green-900 dark:text-green-300">Payment Successful!</h3>
                <p className="text-green-800/80 dark:text-green-400/80 font-medium text-sm">
                  Your deposit has been secured. Your outfitter will be in touch shortly to finalize your arrival dates.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {bookings.length === 0 ? (
          <div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border-2 border-dashed border-kalahari/40 rounded-3xl py-20 px-6 text-center shadow-sm">
            <div className="bg-kalahari/10 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Compass className="h-10 w-10 text-kalahari" />
            </div>
            <h2 className="text-2xl font-black text-olive dark:text-off-white font-headline mb-3">No Upcoming Safaris</h2>
            <p className="text-olive/70 dark:text-off-white/60 font-medium max-w-md mx-auto mb-8">
              You haven't secured any bookings yet. Browse the marketplace to find your next adventure.
            </p>
            <Link href="/marketplace">
              <Button className="h-14 px-8 bg-kalahari hover:bg-kalahari/90 text-white font-black text-lg rounded-xl shadow-lg transition-all hover:-translate-y-1">
                Explore Packages <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        ) : (
          /* Bookings Grid */
          <div className="grid grid-cols-1 gap-8">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white dark:bg-black/40 border border-kalahari/20 rounded-3xl overflow-hidden shadow-xl flex flex-col lg:flex-row transition-colors">
                
                {/* Left Side: Image & Core Details */}
                <div className="lg:w-2/5 relative h-64 lg:h-auto bg-stone-100 dark:bg-stone-900 border-r border-kalahari/10">
                  {booking.coverImage ? (
                    <Image src={booking.coverImage} alt={booking.huntTitle} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Compass className="h-16 w-16 text-kalahari/30" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-green-500 text-white text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md flex items-center gap-1.5 backdrop-blur-md">
                      <ShieldCheck className="h-4 w-4" /> Deposit Secured
                    </span>
                  </div>
                </div>

                {/* Right Side: Financials & Actions */}
                <div className="lg:w-3/5 p-6 md:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div>
                        <p className="text-xs font-bold text-kalahari uppercase tracking-widest mb-1">
                          Hosted by {booking.outfitterName || "Verified Outfitter"}
                        </p>
                        <h2 className="text-2xl font-black font-headline text-olive dark:text-off-white line-clamp-2">
                          {booking.huntTitle}
                        </h2>
                      </div>
                      <Link href={`/hunts/${booking.huntId}`}>
                        <Button variant="outline" size="sm" className="shrink-0 border-kalahari/30 text-olive dark:text-white hover:bg-kalahari/10">
                          View Listing
                        </Button>
                      </Link>
                    </div>

                    {booking.location && (
                      <div className="flex items-center text-sm font-bold text-olive/60 dark:text-white/50 mb-6">
                        <MapPin className="h-4 w-4 mr-1 text-kalahari" /> {booking.location}
                      </div>
                    )}

                    {/* The Balance Tracker */}
                    <div className="bg-stone-50 dark:bg-stone-900/50 rounded-2xl p-5 border border-kalahari/20 mb-6">
                      <h3 className="text-sm font-black text-olive dark:text-white mb-4 flex items-center gap-2 border-b border-kalahari/10 pb-2">
                        <DollarSign className="h-4 w-4 text-kalahari" /> Payment Ledger
                      </h3>
                      
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs font-bold text-olive/60 dark:text-white/50 mb-1 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3 text-green-500" /> Paid Today
                          </p>
                          <p className="text-xl font-black text-green-600 dark:text-green-400">
                            ${(booking.depositPaidUSD || 0).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="hidden md:block w-px bg-kalahari/20" />
                        
                        <div className="flex-1">
                          <p className="text-xs font-bold text-olive/60 dark:text-white/50 mb-1 flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-orange-500" /> Due on Arrival
                          </p>
                          <p className="text-xl font-black text-orange-600 dark:text-orange-400">
                            ${(booking.balanceDueUSD || 0).toLocaleString()}
                          </p>
                        </div>

                        <div className="hidden md:block w-px bg-kalahari/20" />

                        <div className="flex-1">
                          <p className="text-xs font-bold text-olive/60 dark:text-white/50 mb-1">Total Price</p>
                          <p className="text-xl font-black text-olive dark:text-white">
                            ${(booking.totalPriceUSD || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <Link href={`/messages?user=${booking.outfitterId}`} className="w-full">
                      <Button className="w-full h-12 bg-kalahari hover:bg-kalahari/90 text-white font-black shadow-md transition-all flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> Coordinate Dates
                      </Button>
                    </Link>
                    <Button 
                      onClick={() => generatePDFReceipt(booking, auth.currentUser?.displayName || "Valued Hunter")}
                      variant="outline" 
                      className="w-full h-12 border-2 border-kalahari/30 text-olive dark:text-white font-black hover:bg-kalahari/10 transition-all flex items-center gap-2"
                    >
                      <Download className="h-4 w-4 text-kalahari" /> Download Receipt
                    </Button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}