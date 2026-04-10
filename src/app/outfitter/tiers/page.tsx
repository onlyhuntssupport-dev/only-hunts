"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client"; 
import { initializeSubscription } from "@/app/actions/paystack";
import { ArrowLeft, CheckCircle2, Shield, Zap, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OutfitterTiersPage() {
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<"standard" | "pro" | null>(null);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser && currentUser.email) {
        setUser({ uid: currentUser.uid, email: currentUser.email });
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleUpgrade = async (tierType: "standard" | "pro") => {
    if (!user) return;
    setLoadingTier(tierType);
    setError("");

    try {
      // NOTE: Your backend action will need to be updated to accept tierType 
      // to determine if it charges R399 or R799.
      const { authorizationUrl } = await initializeSubscription(user.email, user.uid);
      window.location.href = authorizationUrl;
    } catch (err) {
      console.error("Upgrade failed:", err);
      setError("Failed to initialize payment. Please try again.");
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-off-white dark:bg-stone-950 transition-colors duration-300 pb-20">
      
      {/* Header */}
      <div className="bg-olive dark:bg-black py-12 md:py-20 border-b-4 border-kalahari relative overflow-hidden text-center">
        <div className="absolute inset-0 opacity-10 bg-[url('/pattern.svg')]"></div>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <button 
            onClick={() => router.push('/outfitter/dashboard')}
            className="flex items-center text-kalahari hover:text-white text-sm font-bold transition-colors mb-6 mx-auto absolute top-0 left-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </button>
          
          <h1 className="text-4xl md:text-6xl font-black font-headline text-white tracking-tight mt-8">
            Scale Your Safari Business
          </h1>
          <p className="text-off-white/70 mt-4 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Choose your outfitter plan to secure premium marketplace placement and powerful business tools.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-12">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 text-red-800 font-bold flex items-center justify-between">
            {error}
            <button onClick={() => setError("")}><X className="h-5 w-5 text-red-500" /></button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Standard Tier */}
          <div className="bg-white dark:bg-stone-900 border-2 border-kalahari/20 rounded-3xl p-8 shadow-sm relative">
            <h3 className="text-2xl font-black font-headline text-olive dark:text-off-white mb-2">
              Standard Tier
            </h3>
            <p className="text-4xl font-black text-olive/80 dark:text-off-white/80 mb-2">
              R399<span className="text-lg text-olive/50 dark:text-off-white/50">/month</span>
            </p>
            <p className="text-xs font-bold text-olive/50 dark:text-off-white/50 mb-6 uppercase tracking-wider">
              Cancel Anytime. Essential Tools.
            </p>

            <div className="space-y-4 mb-8 bg-slate-50 dark:bg-stone-800/50 p-6 rounded-2xl border border-slate-100 dark:border-stone-800">
              <div className="flex items-start text-sm font-bold text-olive/80 dark:text-off-white/80">
                <CheckCircle2 className="h-5 w-5 text-kalahari/50 mr-3 shrink-0" /> 
                <span>Standard Deposit Commission (12%)</span>
              </div>
              <div className="flex items-start text-sm font-bold text-olive/80 dark:text-off-white/80">
                <CheckCircle2 className="h-5 w-5 text-kalahari/50 mr-3 shrink-0" /> 
                <span>Basic Marketplace Listing</span>
              </div>
              <div className="flex items-start text-sm font-bold text-olive/80 dark:text-off-white/80">
                <CheckCircle2 className="h-5 w-5 text-kalahari/50 mr-3 shrink-0" /> 
                <span>Limited to 5 Active Safaris</span>
              </div>
              <div className="flex items-start text-sm font-bold text-olive/40 dark:text-off-white/40">
                <X className="h-5 w-5 text-olive/30 mr-3 shrink-0" /> 
                <span className="line-through">No Verified Pro Badge</span>
              </div>
              <div className="flex items-start text-sm font-bold text-olive/40 dark:text-off-white/40">
                <X className="h-5 w-5 text-olive/30 mr-3 shrink-0" /> 
                <span className="line-through">Standard Support</span>
              </div>
            </div>

            <Button 
              onClick={() => handleUpgrade("standard")}
              disabled={loadingTier !== null || !user}
              variant="outline" 
              className="w-full border-2 border-kalahari/30 text-olive dark:text-off-white hover:bg-kalahari/5 font-black h-14 rounded-xl transition-all"
            >
              {loadingTier === "standard" ? (
                <><Loader2 className="h-6 w-6 animate-spin mr-2" /> Initializing...</>
              ) : (
                "Subscribe to Standard"
              )}
            </Button>
          </div>

          {/* Pro Tier (The Target) */}
          <div className="bg-white dark:bg-stone-900 border-4 border-kalahari rounded-3xl p-8 shadow-2xl relative transform md:-translate-y-4">
            <div className="absolute top-0 right-8 -translate-y-1/2">
              <span className="bg-kalahari text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md flex items-center gap-1">
                <Zap className="h-3 w-3 fill-white" /> Recommended
              </span>
            </div>

            <h3 className="text-3xl font-black font-headline text-olive dark:text-off-white mb-2 flex items-center gap-2">
              Pro Tier <Shield className="h-6 w-6 text-kalahari" />
            </h3>
            <p className="text-5xl font-black text-kalahari mb-2">
              R799<span className="text-xl text-olive/50 dark:text-off-white/50">/month</span>
            </p>
            <p className="text-xs font-bold text-olive/50 dark:text-off-white/50 mb-6 uppercase tracking-wider">
              Cancel Anytime. No Hidden Fees.
            </p>

            <div className="space-y-4 mb-8 bg-kalahari/5 p-6 rounded-2xl border border-kalahari/20">
              <div className="flex items-start text-sm font-black text-olive dark:text-off-white">
                <CheckCircle2 className="h-5 w-5 text-kalahari mr-3 shrink-0" /> 
                <span>Reduced Deposit Commission (8%)</span>
              </div>
              <div className="flex items-start text-sm font-black text-olive dark:text-off-white">
                <CheckCircle2 className="h-5 w-5 text-kalahari mr-3 shrink-0" /> 
                <span>Priority Search Placement (Rank Higher)</span>
              </div>
              <div className="flex items-start text-sm font-black text-olive dark:text-off-white">
                <CheckCircle2 className="h-5 w-5 text-kalahari mr-3 shrink-0" /> 
                <span>Unlimited Active Safari Listings</span>
              </div>
              <div className="flex items-start text-sm font-black text-olive dark:text-off-white">
                <CheckCircle2 className="h-5 w-5 text-kalahari mr-3 shrink-0" /> 
                <span>Gold Verified Pro Badge on Profile</span>
              </div>
              <div className="flex items-start text-sm font-black text-olive dark:text-off-white">
                <CheckCircle2 className="h-5 w-5 text-kalahari mr-3 shrink-0" /> 
                <span>Priority 24/7 Platform Support</span>
              </div>
            </div>

            <Button 
              onClick={() => handleUpgrade("pro")}
              disabled={loadingTier !== null || !user}
              className="w-full bg-kalahari text-white hover:bg-kalahari/90 font-black h-14 rounded-xl shadow-lg transition-transform hover:scale-[1.02] text-lg"
            >
              {loadingTier === "pro" ? (
                <><Loader2 className="h-6 w-6 animate-spin mr-2" /> Initializing Checkout...</>
              ) : (
                "Upgrade to Pro"
              )}
            </Button>
            
            <p className="text-center text-[10px] font-bold text-olive/40 dark:text-off-white/40 mt-4 uppercase tracking-widest">
              Secured locally by Paystack
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}