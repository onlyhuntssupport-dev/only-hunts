"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth, db } from "@/lib/firebase/client";
import { getOutfitterStats } from "@/app/actions/outfitter-dashboard";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowRight, Users, Clock, ShieldAlert, Compass, Flame, MessageSquare, Target, CheckCircle, AlertCircle, Info } from 'lucide-react';
import KuduLoader from "@/components/ui/KuduLoader";
import GlobalBookingCalendar from "@/components/outfitter/GlobalBookingCalendar";

interface Stats {
  status: string;
  name: string;
  activeHunts: number;
  pendingHunts: number;
  totalInquiries: number;
}

export default function DashboardOverview() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [totalSaves, setTotalSaves] = useState(0);
  
  const [quoteStats, setQuoteStats] = useState({ pending: 0, accepted: 0 });
  const [bookedDates, setBookedDates] = useState<{start: Date, end: Date, label: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async (uid: string) => {
      try {
        const userDocRef = doc(db, "users", uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.role === "HUNTER" || userData.role === "hunter") {
            router.replace("/hunter/dashboard");
            return; 
          }
        }

        const res = await getOutfitterStats(uid);
        if (res.success && res.data) {
          setStats(res.data as Stats);
        }

        const huntsRef = collection(db, "hunts");
        const qHunts = query(huntsRef, where("outfitterId", "==", uid));
        const snapHunts = await getDocs(qHunts);
        
        let savesTracker = 0;
        snapHunts.forEach(docSnap => {
          const data = docSnap.data();
          if (data.saveCount && data.saveCount > 0) {
            savesTracker += data.saveCount;
          }
        });
        setTotalSaves(savesTracker);

        let pendingCount = 0;
        let acceptedCount = 0;
        const extractedDates: {start: Date, end: Date, label: string}[] = [];

        const processQuote = (d: any) => {
          const data = d.data();
          const status = data.status;
          const isArchived = data.outfitterArchived;
          const isRead = data.outfitterRead;
          
          if (status === "PENDING_OUTFITTER_REVIEW" && !isArchived && !isRead) pendingCount++;
          if (status === "ACCEPTED" && !isArchived) {
            acceptedCount++;
            if (data.logistics?.startDate && data.logistics?.endDate) {
              extractedDates.push({
                start: new Date(data.logistics.startDate),
                end: new Date(data.logistics.endDate),
                label: data.hunterName || "Confirmed Hunt"
              });
            }
          }
        };

        const manualRef = collection(db, "quote_requests");
        const qManual = query(manualRef, where("outfitterId", "==", uid));
        const snapManual = await getDocs(qManual);
        snapManual.forEach(processQuote);

        const autoRef = collection(db, "quotes");
        const qAuto = query(autoRef, where("outfitterId", "==", uid));
        const snapAuto = await getDocs(qAuto);
        snapAuto.forEach(processQuote);

        setQuoteStats({ pending: pendingCount, accepted: acceptedCount });
        setBookedDates(extractedDates);

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadDashboardData(user.uid);
      } else {
        setLoading(false);
        router.push("/login"); 
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <KuduLoader />;
  }

  const isRestricted = stats?.status === "PENDING" || stats?.status === "SUSPENDED";

  return (
    <div className="relative min-h-screen pt-8 px-4 sm:px-6 lg:px-8 pb-20">
      
      {/* Background Image Setup */}
      {/* FIX: Changed fixed inset-0 to absolute h-full w-full so it stays inside the content area */}
      <div className="absolute inset-0 z-0 h-full w-full pointer-events-none overflow-hidden">
        <Image
          src="/outfitter-bg.jpg" 
          alt="Outfitter at Safari Table"
          fill
          quality={100}
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/[0.65] backdrop-blur-[2px]" />
      </div>

      {/* Main Dashboard Content */}
      <div className="space-y-10 max-w-6xl mx-auto relative z-10">
        
        <div className="border-b-2 border-kalahari/20 pb-6">
          <h1 className="text-4xl font-headline font-bold text-off-white tracking-tight">Dashboard Overview</h1>
          <p className="text-off-white/70 mt-2 text-lg font-medium">
            Welcome back{stats?.name ? `, ${stats.name}` : ""}. Here is a snapshot of your business on Only-Hunts.
          </p>
        </div>

        {stats?.status === "PENDING" && (
          <div className="bg-amber-900/20 border border-amber-800/50 p-6 rounded-xl flex items-start gap-4 shadow-sm backdrop-blur-md">
            <Clock className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-amber-400">Account Under Review</h3>
              <p className="text-amber-400/80 mt-1 font-medium">
                Your permit is currently being verified by our admin team. You can prepare your hunt listings now, but they will not appear on the public marketplace until your account is fully approved.
              </p>
            </div>
          </div>
        )}

        {stats?.status === "SUSPENDED" && (
          <div className="bg-red-900/20 border border-red-800/50 p-6 rounded-xl flex items-start gap-4 shadow-sm backdrop-blur-md">
            <ShieldAlert className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-red-400">Account Suspended</h3>
              <p className="text-red-400/80 mt-1 font-medium">
                Your platform access has been suspended and your listings are hidden. Please contact support to resolve this issue.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6 w-full mb-6">
          <div className="relative w-full z-20">
            <Link href="/outfitter/dashboard/only-quotes" className="group block w-full relative">
              <div className="bg-black/60 backdrop-blur-md rounded-3xl relative border-4 border-orange-500 shadow-xl hover:border-orange-400 transition-colors">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] rounded-[1.25rem] overflow-hidden"></div>
                <div className="absolute top-5 right-6 z-50 group/tooltip flex items-center">
                  <Info className="h-6 w-6 text-white hover:text-white/80 cursor-help drop-shadow-md transition-colors" />
                  <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-stone-900 border border-orange-500/50 rounded-xl shadow-2xl text-xs text-left text-white/90 font-medium opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 pointer-events-none z-[60]">
                    <strong className="block text-orange-400 mb-1 text-sm font-black">Auto-Quote Engine</strong>
                    Configure your daily rates, species fees, and group discounts once. The platform will use this matrix to automatically generate and send bespoke, accurate financial proposals to hunters the second they request a custom hunt.
                  </div>
                </div>
                <div className="relative z-10 p-8 flex flex-col items-center justify-center text-center">
                  <h2 className="text-2xl md:text-3xl font-black font-headline text-white tracking-tight flex items-center gap-3 mb-1">
                    <Target className="h-8 w-8 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
                    Only-<span className="text-orange-500">Quotes</span>
                  </h2>
                  <p className="text-orange-400/80 font-bold text-sm uppercase tracking-widest">
                    Auto Quote Generating Form
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <div className="bg-black/60 backdrop-blur-md rounded-3xl overflow-hidden relative border-4 border-orange-500 shadow-xl z-10">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
            <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <h2 className="text-2xl md:text-3xl font-black font-headline text-white tracking-tight flex items-center gap-3">
                  <Clock className="h-8 w-8 text-orange-500 shrink-0" />
                  Quotes <span className="text-orange-500">Inbox</span>
                </h2>
              </div>
              <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row gap-4">
                <Link href="/outfitter/dashboard/custom-quotes?tab=pending" className="w-full sm:w-auto">
                  <div className="bg-black/40 hover:bg-black/60 text-white font-black text-sm h-12 px-6 rounded-xl shadow-sm hover:-translate-y-0.5 transition-all flex items-center justify-between gap-4 w-full border-2 border-orange-500">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-400" /> Action Required
                    </span>
                    <span className={`${quoteStats.pending > 0 ? "bg-orange-500 animate-pulse" : "bg-orange-500/50"} text-white px-2 py-0.5 rounded-md text-xs shadow-sm`}>
                      {quoteStats.pending}
                    </span>
                  </div>
                </Link>
                <Link href="/outfitter/dashboard/custom-quotes?tab=accepted" className="w-full sm:w-auto">
                  <div className="bg-black/40 hover:bg-black/60 text-white font-black text-sm h-12 px-6 rounded-xl shadow-sm hover:-translate-y-0.5 transition-all flex items-center justify-between gap-4 w-full border-2 border-orange-500">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-orange-400" /> Accepted
                    </span>
                    <span className="bg-orange-500 text-white px-2 py-0.5 rounded-md text-xs shadow-sm">
                      {quoteStats.accepted}
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <Link href="/messages" className="group block h-full">
            <Card className="border-kalahari/40 shadow-sm transition-all bg-black/60 backdrop-blur-md group-hover:border-kalahari group-hover:-translate-y-1 group-hover:shadow-lg h-full cursor-pointer flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-off-white/70 uppercase tracking-wider group-hover:text-off-white transition-colors">Messages</CardTitle>
                <MessageSquare className="h-5 w-5 text-kalahari" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-off-white pt-1">Inbox</div>
                <p className="text-xs text-off-white/60 mt-2 font-medium flex items-center justify-between">
                  Direct chats <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-kalahari" />
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/outfitter/dashboard/hunts" className="group block h-full">
            <Card className="border-kalahari/40 shadow-sm transition-all bg-black/60 backdrop-blur-md group-hover:border-kalahari group-hover:-translate-y-1 group-hover:shadow-lg h-full cursor-pointer flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-off-white/70 uppercase tracking-wider group-hover:text-off-white transition-colors">Active Hunts</CardTitle>
                <Compass className="h-5 w-5 text-kalahari" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-off-white">{stats?.activeHunts || 0}</div>
                <p className="text-xs text-off-white/60 mt-2 font-medium flex items-center justify-between">
                  Live on marketplace <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-kalahari" />
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/outfitter/dashboard/hunts" className="group block h-full">
            <Card className="border-kalahari/40 shadow-sm transition-all bg-black/60 backdrop-blur-md group-hover:border-kalahari group-hover:-translate-y-1 group-hover:shadow-lg h-full cursor-pointer flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-off-white/70 uppercase tracking-wider group-hover:text-off-white transition-colors">Pending</CardTitle>
                <Clock className="h-5 w-5 text-kalahari" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-off-white">{stats?.pendingHunts || 0}</div>
                <p className="text-xs text-off-white/60 mt-2 font-medium flex items-center justify-between">
                  Awaiting review <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-kalahari" />
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/outfitter/dashboard/leads" className="group block h-full">
            <Card className="border-kalahari/40 shadow-sm transition-all bg-black/60 backdrop-blur-md group-hover:border-kalahari group-hover:-translate-y-1 group-hover:shadow-lg h-full cursor-pointer flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-off-white/70 uppercase tracking-wider group-hover:text-off-white transition-colors">Inquiries</CardTitle>
                <Users className="h-5 w-5 text-kalahari" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-off-white">{stats?.totalInquiries || 0}</div>
                <p className="text-xs text-off-white/60 mt-2 font-medium flex items-center justify-between">
                  Active leads <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-kalahari" />
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/outfitter/dashboard/offers" className="group block h-full">
            <Card className="shadow-sm transition-all bg-gradient-to-br from-black/60 to-orange-900/40 backdrop-blur-md h-full flex flex-col justify-between border-orange-800/50 group-hover:border-orange-500 group-hover:-translate-y-1 group-hover:shadow-lg cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-orange-400 uppercase tracking-wider transition-colors">Wishlist Offers</CardTitle>
                <Flame className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-orange-400">{totalSaves}</div>
                <p className="text-xs text-orange-400/70 mt-2 font-medium flex items-center justify-between">
                  Manage blind offers <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-1 h-full">
            <GlobalBookingCalendar bookedRanges={bookedDates} />
          </div>
          <div className="lg:col-span-2 text-center border-2 border-dashed border-kalahari/30 bg-black/60 backdrop-blur-md rounded-3xl p-12 shadow-sm flex flex-col justify-center items-center h-full">
            <h3 className="text-2xl font-bold font-headline text-off-white mb-3">Ready to list your next package?</h3>
            <p className="text-off-white/70 max-w-lg mx-auto mb-8 font-medium">
              Start reaching hunters globally by adding a new, premium hunting package to the Only-Hunts marketplace.
            </p>
            {isRestricted ? (
              <Button size="lg" disabled className="opacity-50 cursor-not-allowed bg-black/50 text-off-white/50 font-bold h-12 px-8">
                Account Restricted <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button size="lg" onClick={() => router.push("/outfitter/dashboard/hunts/new")} className="bg-kalahari hover:bg-kalahari/90 text-olive font-black text-lg h-14 px-10 shadow-md transition-all">
                Create a New Hunt <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}