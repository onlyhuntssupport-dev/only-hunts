"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { sendBlindOffers } from "@/app/actions/offers";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Send, Flame, Loader2, X, CheckCircle, Search } from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";

interface SavedHunt {
  id: string;
  title: string;
  price: number;
  basePrice?: number;
  coverImage?: string;
  imageUrl?: string;
  saveCount: number;
}

export default function OffersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savedHunts, setSavedHunts] = useState<SavedHunt[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [selectedHunt, setSelectedHunt] = useState<SavedHunt | null>(null);
  const [offerMessage, setOfferMessage] = useState("");
  const [sendingOffer, setSendingOffer] = useState(false);
  const [offerSuccessCount, setOfferSuccessCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchWishlistedHunts = async () => {
      if (!auth.currentUser) return;

      try {
        const huntsRef = collection(db, "hunts");
        const q = query(huntsRef, where("outfitterId", "==", auth.currentUser.uid));
        const snap = await getDocs(q);
        
        const arr: SavedHunt[] = [];

        snap.forEach(docSnap => {
          const data = docSnap.data();
          if (data.saveCount && data.saveCount > 0) {
            arr.push({
              id: docSnap.id,
              title: data.title,
              price: data.price || data.basePrice || 0,
              coverImage: data.coverImage || data.imageUrl,
              saveCount: data.saveCount
            });
          }
        });

        // Sort by most saves first
        setSavedHunts(arr.sort((a, b) => b.saveCount - a.saveCount));
      } catch (error) {
        console.error("Error loading saved hunts:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchWishlistedHunts();
      else router.push("/login");
    });

    return () => unsubscribe();
  }, [router]);

  const openOfferModal = (hunt: SavedHunt) => {
    setSelectedHunt(hunt);
    setOfferMessage("");
    setOfferSuccessCount(null);
    setOfferModalOpen(true);
  };

  const submitOffer = async () => {
    if (!auth.currentUser || !selectedHunt || !offerMessage.trim()) return;
    
    setSendingOffer(true);
    
    const result = await sendBlindOffers(
      auth.currentUser.uid,
      selectedHunt.id,
      selectedHunt.title,
      offerMessage
    );

    setSendingOffer(false);

    if (result.success) {
      setOfferSuccessCount(result.count || 0);
      setTimeout(() => {
        setOfferModalOpen(false);
      }, 3000); // Close automatically after 3 seconds
    } else {
      alert(result.error || "Failed to send offers.");
    }
  };

  if (loading) return <KuduLoader />;

  const filteredHunts = savedHunts.filter(hunt => 
    hunt.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20">
      
      {/* HEADER */}
      <div className="border-b-2 border-kalahari/30 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/outfitter/dashboard" className="p-2 bg-white border-2 border-kalahari/20 rounded-lg hover:border-kalahari transition-colors">
            <ArrowLeft className="h-6 w-6 text-olive dark:text-off-white" />
          </Link>
          <div>
            <h1 className="text-4xl font-headline font-bold text-olive dark:text-off-white tracking-tight">Wishlist Offers</h1>
            <p className="text-olive dark:text-off-white/70 mt-2 text-lg font-medium">
              Turn watchers into buyers. Send exclusive blind offers to hunters who saved your packages.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        {savedHunts.length > 0 && (
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-olive dark:text-off-white/40" />
            <input 
              type="text" 
              placeholder="Search saved packages..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-kalahari/20 bg-white focus:border-kalahari focus:ring-kalahari text-olive dark:text-off-white font-medium outline-none transition-all"
            />
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      {savedHunts.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-kalahari/30 rounded-2xl p-12 text-center shadow-sm">
          <div className="mx-auto h-20 w-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
            <Flame className="h-10 w-10 text-orange-300" />
          </div>
          <h2 className="text-2xl font-black font-headline text-olive dark:text-off-white mb-3">No Wishlisted Packages Yet</h2>
          <p className="text-olive dark:text-off-white/70 max-w-lg mx-auto font-medium">
            When hunters browse the marketplace and click the heart icon to save your packages, they will appear here so you can send them targeted discounts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHunts.map(hunt => (
            <div key={hunt.id} className="bg-white border-2 border-kalahari/20 rounded-2xl overflow-hidden shadow-sm hover:border-kalahari/60 hover:shadow-md transition-all flex flex-col">
              
              {/* Image Header */}
              <div className="h-48 relative bg-kalahari/10 border-b-2 border-kalahari/20">
                {hunt.coverImage ? (
                  <img src={hunt.coverImage} alt={hunt.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Target className="h-12 w-12 text-olive dark:text-off-white/20" />
                  </div>
                )}
                
                {/* Save Badge */}
                <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-black flex items-center shadow-lg">
                  <Flame className="h-4 w-4 mr-1.5" />
                  {hunt.saveCount} {hunt.saveCount === 1 ? 'Save' : 'Saves'}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold font-headline text-olive dark:text-off-white line-clamp-2 mb-2">{hunt.title}</h3>
                <p className="text-olive dark:text-off-white/60 font-bold mb-6">${hunt.price.toLocaleString()}</p>
                
                <div className="mt-auto">
                  <Button 
                    onClick={() => openOfferModal(hunt)}
                    className="w-full bg-olive hover:bg-olive/90 text-kalahari font-bold shadow-md h-12"
                  >
                    <Send className="h-5 w-5 mr-2" /> Send Bulk Offer
                  </Button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* --- BLIND OFFER MODAL --- */}
      {offerModalOpen && selectedHunt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-kalahari/20">
            
            <div className="flex items-center justify-between p-6 border-b border-kalahari/10 bg-off-white">
              <h3 className="text-xl font-black text-olive dark:text-off-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" /> Send Blind Offer
              </h3>
              <button 
                onClick={() => setOfferModalOpen(false)}
                className="text-olive dark:text-off-white/40 hover:text-olive dark:text-off-white/80 transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {offerSuccessCount !== null ? (
                <div className="text-center py-8">
                  <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-black text-olive dark:text-off-white mb-2">Offer Sent!</h3>
                  <p className="text-olive dark:text-off-white/70 font-medium">
                    Your exclusive offer was securely delivered to <strong>{offerSuccessCount}</strong> {offerSuccessCount === 1 ? 'hunter' : 'hunters'}.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mb-6">
                    <p className="text-sm text-orange-800 font-medium">
                      You are sending an exclusive offer to <strong>{selectedHunt.saveCount} hunters</strong> who saved <strong>"{selectedHunt.title}"</strong>.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-olive dark:text-off-white/80 uppercase tracking-wide">
                      Your Message & Offer Details
                    </label>
                    <textarea 
                      value={offerMessage}
                      onChange={(e) => setOfferMessage(e.target.value)}
                      placeholder="e.g. Hey! I have a cancellation next month. I can knock $500 off the total price if you book today."
                      className="w-full h-32 p-4 bg-off-white border-2 border-kalahari/20 rounded-xl focus:border-kalahari focus:ring-kalahari text-olive dark:text-off-white resize-none"
                    />
                  </div>

                  <div className="mt-8 flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setOfferModalOpen(false)}
                      className="flex-1 font-bold border-kalahari/30 text-olive dark:text-off-white hover:bg-kalahari/10"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={submitOffer}
                      disabled={sendingOffer || !offerMessage.trim()}
                      className="flex-1 bg-olive hover:bg-olive/90 text-kalahari font-bold"
                    >
                      {sendingOffer ? <Loader2 className="h-5 w-5 animate-spin text-kalahari" /> : <><Send className="h-4 w-4 mr-2" /> Broadcast Offer</>}
                    </Button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}