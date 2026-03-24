"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase/client";
import { getOutfitterStats } from "@/app/actions/outfitter-dashboard";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowRight, Users, Clock, ShieldAlert, Compass, Flame, MessageSquare } from 'lucide-react';
import KuduLoader from "@/components/ui/KuduLoader";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!auth.currentUser) return;
      
      try {
        // --- THE BOUNCER: Check User Role ---
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          // If they are a hunter, kick them back to the hunter dashboard
          if (userData.role === "HUNTER" || userData.role === "hunter") {
            router.replace("/hunter/dashboard");
            return; // Stop running the rest of the code!
          }
        }

        // --- LOAD OUTFITTER DATA ---
        const res = await getOutfitterStats(auth.currentUser.uid);
        if (res.success && res.data) {
          setStats(res.data as Stats);
        }

        // --- LOAD WISHLIST SAVES COUNT ---
        const huntsRef = collection(db, "hunts");
        const q = query(huntsRef, where("outfitterId", "==", auth.currentUser.uid));
        const snap = await getDocs(q);
        
        let savesTracker = 0;

        snap.forEach(docSnap => {
          const data = docSnap.data();
          if (data.saveCount && data.saveCount > 0) {
            savesTracker += data.saveCount;
          }
        });

        setTotalSaves(savesTracker);

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadDashboardData();
      } else {
        router.push("/login"); // Kick unauthenticated users out
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <KuduLoader />;
  }

  const isRestricted = stats?.status === "PENDING" || stats?.status === "SUSPENDED";

  return (
    <div className="min-h-screen bg-off-white dark:bg-olive transition-colors duration-300 pt-8 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="space-y-10 max-w-6xl mx-auto relative">
        <div className="border-b-2 border-kalahari/30 dark:border-kalahari/20 pb-6 transition-colors">
          <h1 className="text-4xl font-headline font-bold text-olive dark:text-off-white dark:text-off-white tracking-tight transition-colors">Dashboard Overview</h1>
          <p className="text-olive dark:text-off-white/70 dark:text-off-white/70 mt-2 text-lg font-medium transition-colors">
            Welcome back{stats?.name ? `, ${stats.name}` : ""}. Here is a snapshot of your business on Only-Hunts.
          </p>
        </div>

        {stats?.status === "PENDING" && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-kalahari/50 dark:border-amber-800/50 p-6 rounded-xl flex items-start gap-4 shadow-sm transition-colors">
            <Clock className="h-6 w-6 text-amber-700 dark:text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400">Account Under Review</h3>
              <p className="text-amber-900/80 dark:text-amber-400/80 mt-1 font-medium">
                Your permit is currently being verified by our admin team. You can prepare your hunt listings now, but they will not appear on the public marketplace until your account is fully approved.
              </p>
            </div>
          </div>
        )}

        {stats?.status === "SUSPENDED" && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-6 rounded-xl flex items-start gap-4 shadow-sm transition-colors">
            <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-red-800 dark:text-red-400">Account Suspended</h3>
              <p className="text-red-800/80 dark:text-red-400/80 mt-1 font-medium">
                Your platform access has been suspended and your listings are hidden. Please contact support to resolve this issue.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          
          <Link href="/messages" className="group block h-full">
            <Card className="border-kalahari/30 dark:border-kalahari/40 shadow-sm transition-all bg-white dark:bg-black/20 group-hover:border-kalahari dark:group-hover:border-kalahari group-hover:-translate-y-1 group-hover:shadow-lg h-full cursor-pointer flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-olive dark:text-off-white/70 dark:text-off-white/60 uppercase tracking-wider group-hover:text-olive dark:text-off-white dark:group-hover:text-off-white transition-colors">Messages</CardTitle>
                <MessageSquare className="h-5 w-5 text-kalahari" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-olive dark:text-off-white dark:text-off-white pt-1 transition-colors">Inbox</div>
                <p className="text-xs text-olive dark:text-off-white/60 dark:text-off-white/50 mt-2 font-medium flex items-center justify-between transition-colors">
                  Direct chats <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-kalahari" />
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/outfitter/dashboard/hunts" className="group block h-full">
            <Card className="border-kalahari/30 dark:border-kalahari/40 shadow-sm transition-all bg-white dark:bg-black/20 group-hover:border-kalahari dark:group-hover:border-kalahari group-hover:-translate-y-1 group-hover:shadow-lg h-full cursor-pointer flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-olive dark:text-off-white/70 dark:text-off-white/60 uppercase tracking-wider group-hover:text-olive dark:text-off-white dark:group-hover:text-off-white transition-colors">Active Hunts</CardTitle>
                <Compass className="h-5 w-5 text-kalahari" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-olive dark:text-off-white dark:text-off-white transition-colors">{stats?.activeHunts || 0}</div>
                <p className="text-xs text-olive dark:text-off-white/60 dark:text-off-white/50 mt-2 font-medium flex items-center justify-between transition-colors">
                  Live on marketplace <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-kalahari" />
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/outfitter/dashboard/hunts" className="group block h-full">
            <Card className="border-kalahari/30 dark:border-kalahari/40 shadow-sm transition-all bg-white dark:bg-black/20 group-hover:border-kalahari dark:group-hover:border-kalahari group-hover:-translate-y-1 group-hover:shadow-lg h-full cursor-pointer flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-olive dark:text-off-white/70 dark:text-off-white/60 uppercase tracking-wider group-hover:text-olive dark:text-off-white dark:group-hover:text-off-white transition-colors">Pending</CardTitle>
                <Clock className="h-5 w-5 text-kalahari" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-olive dark:text-off-white dark:text-off-white transition-colors">{stats?.pendingHunts || 0}</div>
                <p className="text-xs text-olive dark:text-off-white/60 dark:text-off-white/50 mt-2 font-medium flex items-center justify-between transition-colors">
                  Awaiting review <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-kalahari" />
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/outfitter/dashboard/leads" className="group block h-full">
            <Card className="border-kalahari/30 dark:border-kalahari/40 shadow-sm transition-all bg-white dark:bg-black/20 group-hover:border-kalahari dark:group-hover:border-kalahari group-hover:-translate-y-1 group-hover:shadow-lg h-full cursor-pointer flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-olive dark:text-off-white/70 dark:text-off-white/60 uppercase tracking-wider group-hover:text-olive dark:text-off-white dark:group-hover:text-off-white transition-colors">Inquiries</CardTitle>
                <Users className="h-5 w-5 text-kalahari" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-olive dark:text-off-white dark:text-off-white transition-colors">{stats?.totalInquiries || 0}</div>
                <p className="text-xs text-olive dark:text-off-white/60 dark:text-off-white/50 mt-2 font-medium flex items-center justify-between transition-colors">
                  Active leads <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-kalahari" />
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Updated Wishlist Saves Card */}
          <Link href="/outfitter/dashboard/offers" className="group block h-full">
            <Card className="shadow-sm transition-all bg-gradient-to-br from-white to-orange-50 dark:from-black/30 dark:to-orange-900/20 h-full flex flex-col justify-between border-orange-200 dark:border-orange-800/50 group-hover:border-orange-400 dark:group-hover:border-orange-500 group-hover:-translate-y-1 group-hover:shadow-lg cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider transition-colors">Wishlist Offers</CardTitle>
                <Flame className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 transition-colors">{totalSaves}</div>
                <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-2 font-medium flex items-center justify-between transition-colors">
                  Manage blind offers <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                </p>
              </CardContent>
            </Card>
          </Link>

        </div>

        <div className="text-center border-2 border-dashed border-kalahari/50 dark:border-kalahari/30 bg-white dark:bg-black/20 rounded-xl p-12 shadow-sm transition-colors">
          <h3 className="text-2xl font-bold font-headline text-olive dark:text-off-white dark:text-off-white mb-3 transition-colors">Ready to list your next package?</h3>
          <p className="text-olive dark:text-off-white/70 dark:text-off-white/70 max-w-lg mx-auto mb-8 font-medium transition-colors">
            Start reaching hunters globally by adding a new, premium hunting package to the Only-Hunts marketplace.
          </p>
          {isRestricted ? (
            <Button size="lg" disabled className="opacity-50 cursor-not-allowed bg-olive dark:bg-black/50 text-kalahari dark:text-off-white/50 font-bold h-12 px-8 transition-colors">
              Account Restricted <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button size="lg" onClick={() => router.push("/outfitter/dashboard/hunts/new")} className="bg-olive dark:bg-kalahari hover:bg-olive/90 dark:hover:bg-kalahari/90 text-kalahari dark:text-olive dark:text-off-white font-black text-lg h-14 px-10 shadow-md transition-all">
              Create a New Hunt <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}