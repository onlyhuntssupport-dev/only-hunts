"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/client"; 
import { doc, getDoc } from "firebase/firestore";
import { initializeSubscription, cancelSubscription } from "@/app/actions/paystack";
import { ArrowLeft, CheckCircle2, ShieldCheck, Crosshair, XCircle, Info, Calculator, Search, BadgeCheck, X, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OutfitterTiersPage() {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<"upgrade" | "cancel" | null>(null);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [currentTier, setCurrentTier] = useState<string>("standard");
  const [isFetchingTier, setIsFetchingTier] = useState(true);

  // Auth Bouncer & Tier Check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser && currentUser.email) {
        setUser({ uid: currentUser.uid, email: currentUser.email });
        
        try {
          const outfitterDoc = await getDoc(doc(db, "outfitters", currentUser.uid));
          if (outfitterDoc.exists()) {
            setCurrentTier(outfitterDoc.data().tier || "standard");
          }
        } catch (err) {
          console.error("Failed to fetch tier status", err);
        } finally {
          setIsFetchingTier(false);
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleUpgrade = async () => {
    if (!user) return;
    setLoadingAction("upgrade");
    setError("");

    try {
      const { authorizationUrl } = await initializeSubscription(user.email, user.uid);
      window.location.href = authorizationUrl;
    } catch (err) {
      console.error("Upgrade failed:", err);
      setError("Failed to initialize payment. Please try again.");
      setLoadingAction(null);
    }
  };

  const handleCancel = async () => {
    if (!user) return;
    
    if (!window.confirm("Are you sure you want to cancel? You will immediately lose priority search placement and access to the auto-quote engine.")) {
      return;
    }

    setLoadingAction("cancel");
    setError("");

    try {
      const res = await cancelSubscription(user.email, user.uid);
      if (res.success) {
        alert("Subscription cancelled successfully. You are now on the Standard plan.");
        setCurrentTier("standard");
      } else {
        throw new Error(res.error || "Failed to cancel.");
      }
    } catch (err: any) {
      console.error("Cancellation failed:", err);
      setError(err.message || "Failed to cancel subscription. Please contact support.");
    } finally {
      setLoadingAction(null);
    }
  };

  if (isFetchingTier) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-950"><Loader2 className="h-10 w-10 text-kalahari animate-spin" /></div>;
  }

  const isPro = currentTier === "pro_tier" || currentTier === "PRO" || currentTier === "pro";

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-300 pb-24">
      
      {/* Header Section */}
      <div className="bg-olive dark:bg-black py-16 border-b-4 border-kalahari relative overflow-hidden text-center">
        <div className="absolute inset-0 opacity-10 bg-[url('/pattern.svg')]"></div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-kalahari hover:text-white text-sm font-bold transition-colors mb-8 mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </button>
          <h1 className="text-4xl md:text-5xl font-black font-headline text-white tracking-tight mb-4">
            Outfitter Partner Plans
          </h1>
          <p className="text-off-white/70 text-lg font-medium max-w-2xl mx-auto">
            Transparent pricing, clear terms, and no hidden fees. Choose the tier that fits your booking volume and business goals.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-8 text-red-800 dark:text-red-400 font-bold flex items-center justify-between rounded-r-xl max-w-4xl mx-auto">
            {error}
            <button onClick={() => setError("")}><X className="h-5 w-5 text-red-500" /></button>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          
          {/* TIER 1: STANDARD (FREE) */}
          <div className={`bg-white dark:bg-stone-900 border-2 rounded-3xl p-8 shadow-lg flex flex-col relative h-full transition-all ${!isPro ? 'border-kalahari ring-4 ring-kalahari/10' : 'border-stone-200 dark:border-stone-800 opacity-80'}`}>
            {!isPro && (
              <div className="absolute top-0 right-0 bg-kalahari text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
                Current Plan
              </div>
            )}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="h-8 w-8 text-green-600 dark:text-green-500" />
                <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">Standard</h2>
              </div>
              <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-4">Verified Outfitter</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-stone-900 dark:text-white">R0</span>
                <span className="text-stone-500 dark:text-stone-400 font-bold">/ month</span>
              </div>
              <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mt-2">
                12% Platform Commission per booking.
              </p>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Unlimited Hunt Listings</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Green 'Verified Permit' Shield</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Standard Search Visibility</p>
              </div>
              <div className="flex items-start gap-3 opacity-50 pt-2">
                <XCircle className="h-5 w-5 text-stone-400 shrink-0" />
                <p className="text-sm font-bold text-stone-500 line-through">Auto-Quote Engine</p>
              </div>
              <div className="flex items-start gap-3 opacity-50">
                <XCircle className="h-5 w-5 text-stone-400 shrink-0" />
                <p className="text-sm font-bold text-stone-500 line-through">Priority Feed Placement</p>
              </div>
            </div>

            <div className="mt-auto relative z-10">
              {!isPro ? (
                <div className="w-full h-14 flex items-center justify-center rounded-xl text-lg font-black bg-kalahari/10 border-2 border-kalahari text-kalahari">
                  <CheckCircle2 className="h-5 w-5 mr-2" /> Active Plan
                </div>
              ) : (
                <div className="w-full h-14 flex items-center justify-center rounded-xl text-lg font-black border-2 border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-500">
                  Included
                </div>
              )}
            </div>
          </div>

          {/* TIER 2: ONLY-HUNTS PRO (PAID) */}
          <div className={`bg-stone-950 border-2 rounded-3xl p-8 shadow-2xl flex flex-col relative overflow-hidden h-full transition-all ${isPro ? 'border-kalahari ring-4 ring-kalahari/20' : 'border-zinc-800'}`}>
            <div className="absolute top-0 right-0 bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
              {isPro ? 'Active Plan' : 'Recommended'}
            </div>
            
            <div className="mb-6 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-zinc-800 p-1.5 rounded-lg border border-zinc-700 shadow-inner">
                  <Crosshair className="h-6 w-6 text-zinc-300" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Only-Hunts <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xl border border-zinc-700 ml-1">PRO</span></h2>
              </div>
              <p className="text-sm font-bold text-kalahari uppercase tracking-widest mb-4">Apex Visibility & Automation</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">R800</span>
                <span className="text-zinc-400 font-bold">/ month</span>
              </div>
              <p className="text-sm font-medium text-zinc-400 mt-2 flex items-center gap-2">
                Reduced 8% Platform Commission.
              </p>
            </div>

            <div className="flex-1 space-y-4 mb-8 relative z-10">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-kalahari shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-zinc-200">Everything in Standard</p>
              </div>
              <div className="flex items-start gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                <Calculator className="h-5 w-5 text-kalahari shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">Auto-Quote Engine Unlocked</p>
                  <p className="text-xs text-zinc-400 font-medium mt-1">Platform automatically generates bespoke financial proposals for hunters based on your pricing matrix.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                <Search className="h-5 w-5 text-kalahari shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">Priority Search Algorithm</p>
                  <p className="text-xs text-zinc-400 font-medium mt-1">Your listings are pushed to the top block of the hunter search feed above standard outfitters.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                <BadgeCheck className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">Onyx PRO Pill</p>
                  <p className="text-xs text-zinc-400 font-medium mt-1">Exclusive visual tag displayed next to your name indicating premium status to hunters.</p>
                </div>
              </div>
            </div>

            <div className="mt-auto relative z-10">
              {!isPro ? (
                <>
                  <Button 
                    onClick={handleUpgrade}
                    disabled={loadingAction !== null || !user}
                    className="w-full h-14 text-lg font-black bg-kalahari hover:bg-kalahari/90 text-white shadow-[0_0_20px_rgba(209,164,123,0.3)] transition-all"
                  >
                    {loadingAction === "upgrade" ? (
                      <><Loader2 className="h-6 w-6 animate-spin mr-2" /> Initializing Checkout...</>
                    ) : (
                      "Upgrade to PRO"
                    )}
                  </Button>
                  <p className="text-center text-[10px] font-bold text-zinc-600 mt-3 uppercase tracking-widest">
                    Secured locally by Paystack
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5" /> Active Subscription
                  </div>
                  <Button 
                    onClick={handleCancel}
                    disabled={loadingAction !== null || !user}
                    variant="outline"
                    className="w-full h-12 text-sm font-black border-red-900/50 text-red-500 hover:bg-red-950/30 hover:text-red-400 transition-all flex items-center justify-center gap-2"
                  >
                    {loadingAction === "cancel" ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                      <><AlertTriangle className="h-4 w-4" /> Cancel PRO Plan</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Feature & Terms Clarity */}
        <div className="max-w-4xl mx-auto mt-16 bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-stone-200 dark:border-stone-800 pb-4">
            <Info className="h-6 w-6 text-kalahari" />
            <h3 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">Feature Mechanics & Legal Clarity</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-black text-stone-900 dark:text-white mb-2 text-sm uppercase tracking-wider">1. Commission Deductions</h4>
              <p className="text-sm text-stone-600 dark:text-stone-400 font-medium leading-relaxed">
                Whether you are on the 12% Standard plan or the 8% PRO plan, the Only-Hunts platform commission is automatically deducted exclusively from the hunter's upfront deposit via our payment gateway. You are responsible for collecting the remaining balance directly from the hunter upon arrival. You will never be invoiced post-hunt.
              </p>
            </div>
            <div>
              <h4 className="font-black text-stone-900 dark:text-white mb-2 text-sm uppercase tracking-wider">2. Randomized Priority Search</h4>
              <p className="text-sm text-stone-600 dark:text-stone-400 font-medium leading-relaxed">
                To guarantee fairness and prevent monopolies, PRO outfitters do not buy a fixed #1 spot. Instead, all matching PRO listings are grouped at the top of the search feed, and their order is randomized every time a hunter refreshes the page. Standard listings appear below the PRO block.
              </p>
            </div>
            <div>
              <h4 className="font-black text-stone-900 dark:text-white mb-2 text-sm uppercase tracking-wider">3. The Verified vs. PRO Badge</h4>
              <p className="text-sm text-stone-600 dark:text-stone-400 font-medium leading-relaxed">
                The <strong className="text-green-600 dark:text-green-500">Green Verified Shield</strong> indicates that our administrative team has successfully vetted your professional outfitter permits. It is an industry compliance marker available to all tiers. The <strong className="text-zinc-500 dark:text-zinc-300">Onyx PRO Pill</strong> is a distinct software tag indicating your active subscription to our premium tier.
              </p>
            </div>
            <div>
              <h4 className="font-black text-stone-900 dark:text-white mb-2 text-sm uppercase tracking-wider">4. Subscription Cancellations</h4>
              <p className="text-sm text-stone-600 dark:text-stone-400 font-medium leading-relaxed">
                You may cancel your R800/month PRO subscription at any time. Upon cancellation, your account will instantly downgrade to the Standard (Free) tier, your commission rate will revert to 12%, and the Auto-Quote Engine will be disabled.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}