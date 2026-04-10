"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, PackageOpen, Clock, CheckCircle, MapPin, DollarSign, Image as ImageIcon, Edit, Trash2 } from "lucide-react";

interface Hunt {
  id: string;
  title: string;
  price: number;
  basePrice?: number;
  location: string;
  duration: number;
  status: string; // PENDING, APPROVED, REJECTED
  coverImage?: string;
}

export default function OutfitterHuntsPage() {
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchHunts = async () => {
      if (!auth.currentUser) return;
      
      try {
        // SECURITY: Only fetch hunts where the outfitterId matches the logged-in user
        const huntsRef = collection(db, "hunts");
        const q = query(huntsRef, where("outfitterId", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const fetchedHunts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Hunt[];
        
        // Sort manually by creation date (newest first)
        fetchedHunts.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        setHunts(fetchedHunts);
      } catch (err) {
        console.error("Error fetching hunts:", err);
        setError("Failed to load your packages.");
      } finally {
        setLoading(false);
      }
    };

    fetchHunts();
  }, []);

  // --- NEW DELETE LOGIC ---
  const handleDelete = async (id: string, title: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete "${title}"? This action cannot be undone.`);
    
    if (!confirmDelete) return;

    setIsDeleting(id);
    try {
      await deleteDoc(doc(db, "hunts", id));
      setHunts(prev => prev.filter(hunt => hunt.id !== id));
    } catch (err) {
      console.error("Error deleting hunt:", err);
      alert("Failed to delete package. Please try again.");
    } finally {
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
        <Link href="/outfitter/dashboard/hunts/new">
          <Button className="h-12 px-6 bg-kalahari hover:bg-kalahari/90 text-white font-black shadow-md flex items-center gap-2">
            <Plus className="h-5 w-5" /> Create New Package
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 font-bold">
          {error}
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
            <Card key={hunt.id} className="overflow-hidden border-2 border-kalahari/20 shadow-sm hover:shadow-md transition-all group flex flex-col">
              
              {/* Image Thumbnail */}
              <div className="h-48 bg-kalahari/10 relative border-b-2 border-kalahari/20 overflow-hidden">
                {hunt.coverImage ? (
                  <img src={hunt.coverImage} alt={hunt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-kalahari/40">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {hunt.status === "APPROVED" ? (
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

                {/* --- NEW ACTION BUTTONS --- */}
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