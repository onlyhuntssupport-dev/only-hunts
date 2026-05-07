"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getOutfitterStats } from "@/app/actions/outfitter-dashboard";
import HuntCreator from "@/components/dashboard/HuntCreator";
import { Loader2, AlertCircle, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreateHuntPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [outfitterId, setOutfitterId] = useState<string | null>(null);
    const [outfitterName, setOutfitterName] = useState("Unnamed Outfitter");
    const [outfitterStatus, setOutfitterStatus] = useState<string>("PENDING");
    
    // Tier Evaluation State
    const [isLimitReached, setIsLimitReached] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setOutfitterId(user.uid);
                try {
                    // 1. Fetch standard dashboard stats
                    const res = await getOutfitterStats(user.uid);
                    if (res && res.success && res.data) {
                        setOutfitterName(res.data.name);
                        setOutfitterStatus(res.data.status || "PENDING");
                    }

                    // 2. Perform the Tier & Inventory Pre-Check directly
                    const outfitterDoc = await getDoc(doc(db, "outfitters", user.uid));
                    if (outfitterDoc.exists()) {
                        const data = outfitterDoc.data();
                        
                        // Calculate effective tier (honoring promo dates)
                        const isPromoActive = data.promoExpiresAt && new Date(data.promoExpiresAt) > new Date();
                        const effectiveTier = (isPromoActive || data.tier === "PRO" || data.tier === "pro") ? "PRO" : "STANDARD";

                        // If they are on the free tier, count their active hunts
                        if (effectiveTier === "STANDARD") {
                            const huntsQuery = query(
                                collection(db, "hunts"),
                                where("outfitterId", "==", user.uid),
                                where("status", "in", ["ACTIVE", "APPROVED", "PENDING"])
                            );
                            const huntsSnap = await getDocs(huntsQuery);
                            
                            // If they are at or over the limit, trigger the paywall
                            if (huntsSnap.size >= 5) {
                                setIsLimitReached(true);
                            }
                        }
                    }

                } catch (error) {
                    console.error("Failed to fetch outfitter stats or tier limits:", error);
                }
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    if (loading || !outfitterId) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="animate-spin h-10 w-10 text-kalahari" />
            </div>
        );
    }

    // THE PAYWALL UI
    if (isLimitReached) {
        return (
            <div className="container mx-auto max-w-3xl py-12 px-4">
                <div className="bg-white dark:bg-stone-900 border-2 border-kalahari/20 rounded-3xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-2 bg-kalahari"></div>
                    
                    <div className="mx-auto w-20 h-20 bg-kalahari/10 rounded-full flex items-center justify-center mb-6">
                        <Lock className="h-10 w-10 text-kalahari" />
                    </div>
                    
                    <h1 className="text-3xl font-black font-headline text-stone-900 dark:text-white mb-4">
                        Inventory Limit Reached
                    </h1>
                    
                    <p className="text-lg text-stone-600 dark:text-stone-400 mb-8 max-w-xl mx-auto font-medium">
                        Your Standard account has reached the maximum limit of <strong>5 active hunt listings</strong>. To continue expanding your catalog and reach more international hunters, upgrade to our premium tier.
                    </p>

                    <div className="bg-stone-50 dark:bg-stone-950 rounded-2xl p-6 text-left max-w-md mx-auto mb-8 border border-stone-200 dark:border-stone-800">
                        <h3 className="font-black text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-kalahari" /> Unlocked on PRO:
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-sm font-bold text-stone-600 dark:text-stone-400">
                                <div className="h-1.5 w-1.5 rounded-full bg-kalahari"></div> Unlimited Active Listings
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-stone-600 dark:text-stone-400">
                                <div className="h-1.5 w-1.5 rounded-full bg-kalahari"></div> Instant Hunter Contact (Phone & Email)
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-stone-600 dark:text-stone-400">
                                <div className="h-1.5 w-1.5 rounded-full bg-kalahari"></div> Priority Search Algorithm
                            </li>
                        </ul>
                    </div>

                    <Button 
                        onClick={() => router.push('/outfitter/tiers')}
                        className="h-14 px-8 text-lg font-black bg-kalahari hover:bg-kalahari/90 text-white shadow-lg shadow-kalahari/20 transition-all rounded-xl w-full sm:w-auto"
                    >
                        View Plans & Upgrade <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </div>
        );
    }

    // NORMAL RENDER (If under limit or on PRO)
    return (
        <div className="container mx-auto max-w-4xl py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-headline text-stone-900 dark:text-white">Create a New Hunt</h1>
                <p className="text-stone-500 mt-2">
                    Fill out the form below to add a new package to your outfitter profile.
                </p>
                
                {/* Draft Mode Reminder */}
                {outfitterStatus === "PENDING" && (
                    <div className="mt-4 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-amber-800">
                            <strong>Draft Mode Active:</strong> Because your account is currently pending permit verification, this hunt will automatically be saved as a Draft. You can publish it live once you are approved.
                        </p>
                    </div>
                )}
            </div>
            
            {/* Pass the status down to the actual form engine */}
            <HuntCreator 
                outfitterId={outfitterId} 
                outfitterName={outfitterName} 
                outfitterStatus={outfitterStatus} 
            />
        </div>
    );
}