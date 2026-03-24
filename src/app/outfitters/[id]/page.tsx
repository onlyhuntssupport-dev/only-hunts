"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Loader2, Star, MapPin, Target, ShieldCheck, User, Compass, Calendar, DollarSign, AlertCircle } from "lucide-react";

interface OutfitterProfile {
  name: string;
  companyName?: string;
  profileImageUrl?: string;
  platformRating?: number;
  reviewCount?: number;
  location?: string;
  bio?: string;
}

interface Hunt {
  id: string;
  title: string;
  price?: number;
  basePrice?: number;
  duration: number;
  location: string;
  coverImage?: string;
  imageUrl?: string;
  images?: string[];
  primarySpecies?: string;
}

export default function OutfitterStorefront() {
  const params = useParams();
  const outfitterId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [outfitter, setOutfitter] = useState<OutfitterProfile | null>(null);
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStorefrontData = async () => {
      try {
        // 1. Fetch Outfitter Profile
        const userDoc = await getDoc(doc(db, "users", outfitterId));
        if (!userDoc.exists() || (userDoc.data()?.role !== "OUTFITTER" && userDoc.data()?.role !== "outfitter")) {
          setError("Outfitter not found.");
          setLoading(false);
          return;
        }
        setOutfitter(userDoc.data() as OutfitterProfile);

        // 2. Fetch Active Hunts for this Outfitter
        const huntsRef = collection(db, "hunts");
        const q = query(
          huntsRef, 
          where("outfitterId", "==", outfitterId),
          where("status", "==", "APPROVED")
        );
        const querySnapshot = await getDocs(q);
        
        const fetchedHunts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Hunt[];
        
        // Sort by newest
        fetchedHunts.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        setHunts(fetchedHunts);
      } catch (err) {
        console.error("Error fetching storefront:", err);
        setError("Failed to load Outfitter profile.");
      } finally {
        setLoading(false);
      }
    };

    if (outfitterId) fetchStorefrontData();
  }, [outfitterId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-off-white dark:bg-olive transition-colors duration-300">
        <Loader2 className="animate-spin h-12 w-12 text-kalahari" />
      </div>
    );
  }

  if (error || !outfitter) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4 bg-off-white dark:bg-olive transition-colors duration-300">
        <AlertCircle className="h-16 w-16 text-kalahari mb-4" />
        <h2 className="text-2xl font-black font-headline text-olive dark:text-off-white">{error || "Profile Unavailable"}</h2>
        <p className="text-olive dark:text-off-white/60 mt-2 font-medium">The outfitter you are looking for does not exist or has been removed.</p>
        <Link href="/">
          <Button className="mt-6 bg-olive dark:bg-kalahari hover:bg-olive/90 dark:hover:bg-kalahari/90 text-kalahari dark:text-olive font-bold shadow-md transition-all">
            Return to Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  const companyName = outfitter.companyName || outfitter.name || "Professional Outfitter";
  const profileImage = outfitter.profileImageUrl || "";
  const location = outfitter.location || "South Africa";
  const bio = outfitter.bio || "This outfitter hasn't added a bio yet, but they offer incredible premium experiences in the African bush.";
  const rating = outfitter.platformRating || 0;
  const reviewCount = outfitter.reviewCount || 0;

  return (
    <div className="min-h-screen bg-off-white dark:bg-olive pb-20 transition-colors duration-300">
      
      {/* HEADER / COVER SECTION */}
      <div className="bg-olive dark:bg-black/40 relative pt-32 pb-24 border-b-4 border-kalahari transition-colors">
        {/* Abstract background pattern for the cover */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
          
          {/* Profile Picture */}
          <div className="h-32 w-32 md:h-40 md:w-40 bg-off-white dark:bg-black/50 border-4 border-kalahari rounded-2xl overflow-hidden shrink-0 flex items-center justify-center shadow-2xl translate-y-12 md:translate-y-16 transition-colors">
            {profileImage ? (
              <Image src={profileImage} alt={companyName} fill className="object-cover" />
            ) : (
              <User className="h-16 w-16 text-olive/30 dark:text-kalahari/30" />
            )}
          </div>

          {/* Outfitter Info */}
          <div className="text-center md:text-left mt-8 md:mt-0 flex-1">
            <div className="inline-flex items-center gap-1.5 bg-kalahari text-olive px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3 shadow-md">
              <ShieldCheck className="h-4 w-4" /> Verified Outfitter
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black font-headline text-off-white tracking-tight mb-3">
              {companyName}
            </h1>
            
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 text-off-white/80 font-medium">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-kalahari" /> {location}</span>
              <span className="hidden sm:inline text-kalahari/40">•</span>
              
              {/* Ratings Display */}
              <div className="flex items-center gap-1.5">
                <Star className={`h-4 w-4 ${rating > 0 ? "text-kalahari fill-kalahari" : "text-off-white/30"}`} />
                <span className="font-bold text-off-white">{rating > 0 ? rating.toFixed(1) : "New"}</span>
                <span className="text-off-white/50 text-sm ml-1">
                  ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT */}
      <div className="max-w-6xl mx-auto px-6 mt-20 md:mt-24 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* LEFT COLUMN: ABOUT */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-black/30 p-6 rounded-2xl border-2 border-kalahari/20 dark:border-kalahari/30 shadow-sm transition-colors backdrop-blur-sm">
            <h2 className="text-xl font-black font-headline text-olive dark:text-off-white mb-4 transition-colors">About the Outfitter</h2>
            <p className="text-olive/80 dark:text-off-white/70 leading-relaxed font-medium whitespace-pre-wrap transition-colors">
              {bio}
            </p>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-950/30 p-6 rounded-2xl border-2 border-orange-200 dark:border-orange-800/50 shadow-sm transition-colors">
            <h3 className="text-lg font-black text-orange-900 dark:text-orange-400 mb-2 transition-colors">Book with Confidence</h3>
            <p className="text-sm text-orange-800/80 dark:text-orange-400/80 font-medium mb-4 transition-colors">
              When you book through Only-Hunts, your payments are secure and your safari is protected by our platform guarantee.
            </p>
            <div className="flex items-center gap-2 text-sm font-bold text-orange-700 dark:text-orange-500 transition-colors">
              <ShieldCheck className="h-5 w-5" /> 100% Verified Listings
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE HUNTS */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl md:text-3xl font-black font-headline text-olive dark:text-off-white mb-6 flex items-center gap-3 transition-colors">
            <Compass className="h-7 w-7 text-kalahari" /> Packages by {companyName}
          </h2>

          {hunts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-black/20 border-2 border-dashed border-kalahari/30 dark:border-kalahari/40 rounded-2xl shadow-sm transition-colors">
              <Compass className="mx-auto h-12 w-12 text-kalahari/40 mb-4" />
              <h3 className="text-xl font-black text-olive dark:text-off-white mb-2 transition-colors">No Active Packages</h3>
              <p className="text-olive/70 dark:text-off-white/60 font-medium max-w-md mx-auto transition-colors">
                This outfitter is currently updating their inventory. Check back soon for new hunting packages.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hunts.map((hunt) => {
                const displayImage = hunt.coverImage || hunt.imageUrl || (hunt.images && hunt.images[0]);
                const huntPrice = hunt.price || hunt.basePrice;

                return (
                  <Link 
                    href={`/hunts/${hunt.id}`} 
                    key={hunt.id}
                    className="group flex flex-col bg-white dark:bg-black/30 rounded-xl border-2 border-kalahari/20 dark:border-kalahari/30 overflow-hidden hover:border-kalahari dark:hover:border-kalahari/80 hover:shadow-xl transition-all duration-300"
                  >
                    {/* Image Container */}
                    <div className="relative h-56 w-full bg-off-white dark:bg-black/50 border-b-2 border-kalahari/20 dark:border-kalahari/30 overflow-hidden transition-colors">
                      {displayImage ? (
                        <Image
                          src={displayImage}
                          alt={hunt.title || "Hunting Package"}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-kalahari">
                          <Compass className="h-12 w-12" />
                        </div>
                      )}
                      {/* Price Tag Badge */}
                      {huntPrice && (
                        <div className="absolute top-4 right-4 bg-olive dark:bg-black/80 text-kalahari font-black px-3 py-1.5 rounded-lg text-sm flex items-center shadow-lg transition-colors">
                          <DollarSign className="h-4 w-4 mr-0.5" />
                          {huntPrice.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Content Container */}
                    <div className="p-5 flex flex-col flex-grow">
                      {/* Hunt Title */}
                      <h3 className="text-lg font-black font-headline text-olive dark:text-off-white mb-4 line-clamp-2 group-hover:text-olive/80 dark:group-hover:text-off-white/80 transition-colors">
                        {hunt.title || "Untitled Hunting Package"}
                      </h3>
                      
                      {/* Hunt Details */}
                      <div className="space-y-2 mt-auto pt-4 border-t-2 border-kalahari/10 dark:border-kalahari/20 transition-colors">
                        <div className="flex items-center text-olive/80 dark:text-off-white/80 text-xs font-bold uppercase tracking-wide transition-colors">
                          <MapPin className="h-4 w-4 mr-2 text-kalahari shrink-0" />
                          <span className="truncate">{hunt.location || "South Africa"}</span>
                        </div>
                        <div className="flex items-center text-olive/80 dark:text-off-white/80 text-xs font-bold uppercase tracking-wide transition-colors">
                          <Calendar className="h-4 w-4 mr-2 text-kalahari shrink-0" />
                          <span>{hunt.duration ? `${hunt.duration} Days` : "Duration varies"}</span>
                        </div>
                        {hunt.primarySpecies && (
                          <div className="flex items-center text-olive/80 dark:text-off-white/80 text-xs font-bold pt-2 mt-2 border-t border-kalahari/10 dark:border-kalahari/20 transition-colors">
                            <Target className="h-4 w-4 mr-2 text-kalahari shrink-0" />
                            <span className="truncate">Target: {hunt.primarySpecies}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}