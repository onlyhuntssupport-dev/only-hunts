"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, deleteDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, PackageOpen, Clock, CheckCircle, MapPin, DollarSign, Image as ImageIcon, Edit, Trash2, Lock, ArrowRight } from "lucide-react";

interface Hunt {
  id: string;
  title: string;
  price: number;
  basePrice?: number;
  location: string;
  duration: number;
  status: string; 
  coverImage?: string;
  createdAt?: any;
  isSoftLocked?: boolean; // Appended locally for UI display
}

export default function OutfitterHuntsPage() {
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Track tier to display the warning banner
  const [effectiveTier, setEffectiveTier] = useState("STANDARD");
  const [hasSoftLockedHunts, setHasSoftLockedHunts] = useState(false);

  useEffect(() => {
    const fetchHunts = async () => {
      if (!auth.currentUser) return;
      
      try {
        // 1. Fetch Outfitter Tier
        const outfitterDoc = await getDoc(doc(db, "outfitters", auth.currentUser.uid));
        let tier = "STANDARD";
        if (outfitterDoc.exists()) {
          const profile = outfitterDoc.data();
          const isPromoActive = profile.promoExpiresAt && new Date(profile.promoExpiresAt) > new Date();
          tier = (isPromoActive || profile.tier === "PRO" || profile.tier === "pro") ? "PRO" : "STANDARD";
        }
        setEffectiveTier(tier);

        // 2. Fetch Hunts
        const huntsRef = collection(db, "hunts");
        const q = query(huntsRef, where("outfitterId", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const fetchedHunts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Hunt[];
        
        // Sort newest first
        fetchedHunts.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        // 3. Apply Soft Lock logic for UI
        let activeCount = 0;
        let foundLocked = false;
        
        const processedHunts = fetchedHunts.map(hunt => {
          if (tier === "STANDARD" && hunt.status === "APPROVED") {
            if (activeCount >= 5) {
              foundLocked = true;
              return { ...hunt, isSoftLocked: true };
            }
            activeCount++;
          }
          return { ...hunt, isSoftLocked: false };
        });

        setHasSoftLockedHunts(foundLocked);
        setHunts(processedHunts);

      } catch (err) {
        console.error("Error fetching hunts:", err);
        setError("Failed to load your packages.");
      } finally {
        setLoading(false);
      }
    };

    fetchHunts();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete "${title}"? This action cannot be undone.`);
    
    if (!confirmDelete) return;

    setIsDeleting(id);
    try {
      await deleteDoc(doc(db, "hunts", id));
      setHunts(prev => prev.filter(hunt => hunt.id !== id));
      // In a robust app, we'd trigger a re-evaluation of the soft lock here, 
      // but reloading the page or forcing a re-fetch handles it cleanly.
      window.location.reload(); 
    } catch (err) {
      console.error("Error deleting hunt:", err);
      alert("Failed to delete package. Please try again.");
      setIsDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-kalahari" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-kalahari/30 pb-6">
        <div>
          <h1 className="text-4xl font-headline font-bold text-olive dark:text-off-white tracking-tight">My Packages</h1>
          <p className="text-olive dark:text-off-white/70 mt-2 text-lg font-medium">
            Manage your hunt listings and pricing.
          </p>
        </div>
        
        {/* Disable creation if they are STANDARD and at the limit */}
        {effectiveTier === "STANDARD" && hunts.filter(h => h.status !== "REJECTED").length >= 5 ? (
          <Link href="/outfitter/tiers">
            <Button className="h-12 px-6 bg-orange-600 hover:bg-orange-700 text-white font-black shadow-md flex items-center gap-2">
              <Lock className="h-5 w-5" /> Upgrade to Create More
            </Button>
          </Link>
        ) : (
          <Link href="/outfitter/dashboard/hunts/new">
            <Button className="h-12 px-6 bg-kalahari hover:bg-kalahari/90 text-white font-black shadow-md flex items-center gap-2">
              <Plus className="h-5 w-5" /> Create New Package
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 font-bold">
          {error}
        </div>
      )}

      {/* --- SOFT LOCK WARNING BANNER --- */}
      {hasSoftLockedHunts && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500/40 p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-md">
          <div className="flex items-start gap-4">
            <Lock className="h-8 w-8 text-orange-500 shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-black text-orange-800 dark:text-orange-400">Inventory Limit Reached</h3>
              <p className="text-orange-700 dark:text-orange-300 mt-1 font-medium text-sm">
                Your standard account is limited to 5 active packages. Any older packages have been paused and hidden from hunters. Upgrade to PRO to reactivate your entire catalog.
              </p>
            </div>
          </div>
          <Link href="/outfitter/tiers" className="shrink-0 w-full md:w-auto mt-4 md:mt-0">
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black">
              Upgrade Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* --- EMPTY STATE --- */}
      {!loading && hunts.length === 0 && !error && (
        <div className="py-20 bg-white border-2 border-dashed border-kalahari/40 rounded-2xl flex flex-col items-center justify-center text-center px-4 shadow-sm">
          <div className="h-20 w-20 bg-kalahari/10 rounded-full flex items-center justify-center mb-6">
            <PackageOpen className="h-10 w-10 text-kalahari" />
          </div>
          <h2 className="text-2xl font-black text-olive dark:text-off-white font-headline mb-3">No Packages Yet</h2>
          <p className="text-olive dark:text-off-white/70 font-medium max-w-md mx-auto mb-8 text-lg">
            Your storefront is currently empty. Create your first hunting package to start attracting clients.
          </p>
          <Link href="/outfitter/dashboard/hunts/new">
            <Button className="h-14 px-8 bg-olive hover:bg-olive/90 text-kalahari text-lg font-black shadow-lg transition-all flex items-center gap-2">
              <Plus className="h-6 w-6" /> Create Your First Hunt
            </Button>
          </Link>
        </div>
      )}

      {/* --- INVENTORY GRID --- */}
      {!loading && hunts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {hunts.map((hunt) => (
            <Card key={hunt.id} className={`overflow-hidden border-2 shadow-sm transition-all group flex flex-col ${hunt.isSoftLocked ? 'border-orange-500/50 opacity-75' : 'border-kalahari/20 hover:shadow-md'}`}>
              
              {/* Image Thumbnail */}
              <div className="h-48 bg-kalahari/10 relative border-b-2 border-kalahari/20 overflow-hidden">
                {hunt.coverImage ? (
                  <img src={hunt.coverImage} alt={hunt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-kalahari/40">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
                
                {/* Status Badge Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none">
                  <div className="flex justify-end">
                    {hunt.isSoftLocked ? (
                      <span className="bg-orange-100 text-orange-800 border border-orange-300 text-xs font-black px-3 py-1 rounded shadow-md flex items-center gap-1.5 uppercase tracking-wide backdrop-blur-md">
                        <Lock className="h-3.5 w-3.5" /> Paused (Limit)
                      </span>
                    ) : hunt.status === "APPROVED" ? (
                      <span className="bg-green-100 text-green-800 border border-green-200 text-xs font-black px-3 py-1 rounded shadow-sm flex items-center gap-1.5 uppercase tracking-wide">
                        <CheckCircle className="h-3.5 w-3.5" /> Live
                      </span>
                    ) : hunt.status === "REJECTED" ? (
                      <span className="bg-red-100 text-red-800 border border-red-200 text-xs font-black px-3 py-1 rounded shadow-sm uppercase tracking-wide">
                        Rejected
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black px-3 py-1 rounded shadow-sm flex items-center gap-1.5 uppercase tracking-wide">
                        <Clock className="h-3.5 w-3.5" /> Pending Review
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Details */}
              <CardContent className="p-5 flex-grow flex flex-col">
                <h3 className="text-xl font-bold font-headline text-olive dark:text-off-white mb-4 line-clamp-2">
                  {hunt.title}
                </h3>
                
                <div className="space-y-2 mt-auto">
                  <div className="flex items-center text-sm font-medium text-olive dark:text-off-white/70">
                    <MapPin className="h-4 w-4 mr-2 text-kalahari" />
                    {hunt.location}
                  </div>
                  <div className="flex items-center text-sm font-medium text-olive dark:text-off-white/70">
                    <Clock className="h-4 w-4 mr-2 text-kalahari" />
                    {hunt.duration} Days
                  </div>
                  <div className="flex items-center text-sm font-black text-olive dark:text-off-white pt-3 mt-3 border-t border-kalahari/10">
                    <DollarSign className="h-4 w-4 mr-1 text-kalahari" />
                    {(hunt.price || hunt.basePrice || 0).toLocaleString()}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-kalahari/10 pt-4">
                  <Link 
                    href={`/outfitter/dashboard/hunts/${hunt.id}/edit`}
                    className="flex items-center justify-center gap-2 bg-off-white dark:bg-stone-800 text-olive dark:text-white font-bold py-2.5 rounded-lg border border-kalahari/20 hover:border-kalahari transition-colors text-sm"
                  >
                    <Edit className="h-4 w-4" /> Edit
                  </Link>
                  <button 
                    onClick={() => handleDelete(hunt.id, hunt.title)}
                    disabled={isDeleting === hunt.id}
                    className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold py-2.5 rounded-lg border border-red-200 dark:border-red-900/50 transition-colors text-sm disabled:opacity-50"
                  >
                    {isDeleting === hunt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4" /> Delete</>}
                  </button>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}