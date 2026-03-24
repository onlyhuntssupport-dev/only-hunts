"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Bookmark, ArrowLeft, Target, MapPin, Trash2 } from "lucide-react";
import { toggleWishlist } from "@/app/actions/wishlist";

interface Hunt {
  id: string;
  title: string;
  price: number;
  duration: number;
  location: string;
  coverImage: string;
}

export default function HunterWishlistPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savedHunts, setSavedHunts] = useState<Hunt[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!auth.currentUser) return;

      try {
        // 1. Get the list of saved Hunt IDs from the user's wishlist document
        const wishlistRef = doc(db, "wishlists", auth.currentUser.uid);
        const wishlistSnap = await getDoc(wishlistRef);
        
        if (!wishlistSnap.exists()) {
          setLoading(false);
          return;
        }

        const huntIds: string[] = wishlistSnap.data().huntIds || [];
        
        if (huntIds.length === 0) {
          setLoading(false);
          return;
        }

        // 2. Fetch the actual hunt details for each ID
        const huntPromises = huntIds.map(id => getDoc(doc(db, "hunts", id)));
        const huntDocs = await Promise.all(huntPromises);
        
        const loadedHunts = huntDocs
          .filter(docSnap => docSnap.exists())
          .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Hunt));

        setSavedHunts(loadedHunts);
      } catch (err) {
        console.error("Error fetching wishlist:", err);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchWishlist();
      else router.push("/login");
    });
    return () => unsubscribe();
  }, [router]);

  const handleRemove = async (huntIdToRemove: string) => {
    if (!auth.currentUser) return;
    setRemovingId(huntIdToRemove);

    // 1. Optimistic UI update instantly hides the card for a snappy feel
    setSavedHunts(prev => prev.filter(hunt => hunt.id !== huntIdToRemove));

    // 2. Fire the secure Server Action (Bypasses the permissions error)
    const result = await toggleWishlist(auth.currentUser.uid, huntIdToRemove);

    if (!result.success) {
      console.error(result.error);
      alert("Failed to remove hunt. Please try again.");
    } 

    setRemovingId(null);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-kalahari" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white pb-20">
      
      {/* Header */}
      <div className="bg-olive py-10 border-b-4 border-kalahari">
        <div className="max-w-6xl mx-auto px-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/hunter/dashboard")}
            className="text-off-white hover:text-kalahari hover:bg-white/10 -ml-4 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Basecamp
          </Button>
          <h1 className="text-4xl md:text-5xl font-black font-headline text-off-white tracking-tight flex items-center gap-3">
            <Bookmark className="h-10 w-10 text-kalahari" /> Saved Hunts
          </h1>
          <p className="text-off-white/70 mt-2 text-lg font-medium">
            Your personalized collection of dream safaris.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        {savedHunts.length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-dashed border-kalahari/30 rounded-2xl shadow-sm">
            <Bookmark className="mx-auto h-16 w-16 text-kalahari/40 mb-4" />
            <h3 className="text-2xl font-black font-headline text-olive dark:text-off-white">Your wishlist is empty</h3>
            <p className="text-olive dark:text-off-white/70 mt-2 mb-8 max-w-md mx-auto font-medium">
              You haven't saved any hunts yet. Browse the marketplace and click the bookmark icon to save hunts for later.
            </p>
            <Link href="/">
              <Button className="bg-olive hover:bg-olive/90 text-kalahari font-black px-8 h-14 text-lg rounded-xl shadow-md">
                Explore Marketplace
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedHunts.map((hunt) => (
              <Card key={hunt.id} className="h-full overflow-hidden border-2 border-kalahari/20 hover:border-kalahari transition-colors group shadow-sm hover:shadow-md flex flex-col relative">
                
                {/* Remove Button Overlay */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove(hunt.id);
                  }}
                  disabled={removingId === hunt.id}
                  className="absolute top-3 right-3 z-20 bg-white/90 hover:bg-red-50 hover:text-red-600 text-olive dark:text-off-white/60 p-2 rounded-full shadow-md backdrop-blur-sm transition-colors border border-kalahari/20"
                  title="Remove from wishlist"
                >
                  {removingId === hunt.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-red-600" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </button>

                <Link href={`/hunts/${hunt.id}`} className="flex-1 flex flex-col">
                  <div className="h-48 relative bg-kalahari/10 overflow-hidden">
                    {hunt.coverImage ? (
                      <img src={hunt.coverImage} alt={hunt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Target className="h-10 w-10 text-olive dark:text-off-white/20" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs font-bold text-olive dark:text-off-white/60 uppercase tracking-wider mb-2">
                      <MapPin className="h-3 w-3" /> {hunt.location}
                    </div>
                    <h3 className="font-black font-headline text-olive dark:text-off-white text-lg leading-tight mb-4 group-hover:text-kalahari transition-colors">
                      {hunt.title}
                    </h3>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-kalahari/10">
                      <span className="font-bold text-olive dark:text-off-white/70">{hunt.duration} Days</span>
                      <span className="font-black text-xl text-olive dark:text-off-white">${hunt.price?.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}