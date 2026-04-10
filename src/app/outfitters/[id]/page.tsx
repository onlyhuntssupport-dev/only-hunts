"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { 
  Star, MapPin, Target, ShieldCheck, User, Compass, Calendar, DollarSign, 
  AlertCircle, Medal, Home, Map, ImageIcon, CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomQuoteModal from "@/components/outfitter/CustomQuoteModal";
import KuduLoader from "@/components/ui/KuduLoader";
import { getOutfitterProfileData } from "@/app/actions/outfitters";
import MessageOutfitterButton from "@/components/marketplace/MessageOutfitterButton";

interface Props {
  params: Promise<{ id: string }>;
}

export default function OutfitterStorefront({ params }: Props) {
  const { id: outfitterId } = use(params);

  const [loading, setLoading] = useState(true);
  const [outfitter, setOutfitter] = useState<any>(null);
  const [hunts, setHunts] = useState<any[]>([]);
  const [error, setError] = useState("");
  
  // NEW: State for booked dates
  const [bookedDates, setBookedDates] = useState<{start: string, end: string}[]>([]);

  const [activeTab, setActiveTab] = useState<'overview' | 'packages' | 'gallery'>('overview');
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  useEffect(() => {
    const fetchStorefrontData = async () => {
      if (!outfitterId) return;
      
      try {
        const res = await getOutfitterProfileData(outfitterId);
        
        if (res.success) {
          setOutfitter({
            ...res.outfitter,
            isPro: res.outfitter.isPro !== false,
            accreditations: res.outfitter.accreditations || [],
            gallery: res.outfitter.gallery || [],
            campType: res.outfitter.campType || "Premium Safari Lodge",
            terrain: res.outfitter.terrain || "Diverse African Bushveld",
            yearsInBusiness: res.outfitter.yearsInBusiness || "Established",
          });
          
          const sortedHunts = (res.hunts || []).sort((a: any, b: any) => {
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          });
          setHunts(sortedHunts);
        } else {
          setError(res.error || "Profile Unavailable");
        }

        // NEW: Fetch confirmed bookings to block dates on the Hunter's Calendar
        const extractedDates: {start: string, end: string}[] = [];
        
        const extractDates = (snap: any) => {
          snap.forEach((docSnap: any) => {
            const data = docSnap.data();
            if (data.status === "ACCEPTED" && !data.outfitterArchived && data.logistics?.startDate && data.logistics?.endDate) {
              extractedDates.push({
                start: data.logistics.startDate,
                end: data.logistics.endDate
              });
            }
          });
        };

        const qManual = query(collection(db, "quote_requests"), where("outfitterId", "==", outfitterId));
        const qAuto = query(collection(db, "quotes"), where("outfitterId", "==", outfitterId));
        
        const [snapManual, snapAuto] = await Promise.all([getDocs(qManual), getDocs(qAuto)]);
        extractDates(snapManual);
        extractDates(snapAuto);

        setBookedDates(extractedDates);

      } catch (err) {
        console.error("Error fetching storefront:", err);
        setError("Failed to load Outfitter profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchStorefrontData();
  }, [outfitterId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-off-white dark:bg-stone-950 transition-colors duration-300">
        <KuduLoader />
      </div>
    );
  }

  if (error || !outfitter) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4 bg-off-white dark:bg-stone-950 transition-colors duration-300">
        <AlertCircle className="h-16 w-16 text-kalahari mb-4" />
        <h2 className="text-2xl font-black font-headline text-olive dark:text-off-white">{error || "Profile Unavailable"}</h2>
        <Link href="/outfitters">
          <Button className="mt-6 bg-olive dark:bg-kalahari text-kalahari dark:text-olive font-bold">
            Return to Directory
          </Button>
        </Link>
      </div>
    );
  }

  const companyName = outfitter.companyName || outfitter.name || "Professional Outfitter";
  const profileImage = outfitter.profileImageUrl || "";
  const location = outfitter.location || "South Africa";
  const rating = outfitter.platformRating || 0;
  const reviewCount = outfitter.reviewCount || 0;

  const startingPrice = hunts.length > 0 
    ? Math.min(...hunts.map(h => h.price || h.basePrice || 999999)) 
    : null;

  return (
    <div className="min-h-screen bg-off-white dark:bg-stone-950 pb-24 transition-colors duration-300 relative">
      
      <div className="h-28 md:h-32 bg-olive dark:bg-black/30 border-b-4 border-kalahari transition-colors relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-20 relative z-10 mb-12">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          
          <div className="h-48 w-48 md:h-52 md:w-52 bg-white dark:bg-stone-900 border-4 border-kalahari rounded-3xl overflow-hidden shrink-0 flex items-center justify-center shadow-2xl relative transition-all">
            {profileImage ? (
              <Image src={profileImage} alt={companyName} fill className="object-cover" priority />
            ) : (
              <User className="h-24 w-24 text-olive/30 dark:text-kalahari/30" />
            )}
          </div>

          <div className="text-center md:text-left pt-6 md:pt-28 flex-1">
            <div className="inline-flex items-center gap-1.5 bg-kalahari/20 text-kalahari border border-kalahari/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3 shadow-sm transition-colors">
              <ShieldCheck className="h-4 w-4" /> Trusted Professional
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-headline text-olive dark:text-white tracking-tight mb-4 transition-colors leading-tight">
              {companyName}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-olive dark:text-white/70 font-bold text-base transition-colors">
              <span className="flex items-center gap-2"><MapPin className="h-5 w-5 text-kalahari" /> {location}</span>
              <span className="hidden sm:inline text-kalahari/40">•</span>
              <div className="flex items-center gap-2">
                <Star className={`h-5 w-5 ${rating > 0 ? "text-kalahari fill-kalahari" : "text-gray-400"}`} />
                <span className="text-olive dark:text-white font-extrabold">{rating > 0 ? rating.toFixed(1) : "New"}</span>
                <span className="text-olive/70 dark:text-white/50 text-sm font-medium">({reviewCount} verified reviews)</span>
              </div>
              <span className="hidden sm:inline text-kalahari/40">•</span>
              <span className="flex items-center gap-2 text-green-700 dark:text-green-500"><CheckCircle2 className="h-5 w-5" /> Established Outfitter</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          <div className="lg:col-span-2 order-2 lg:order-1">
            
            <div className="flex overflow-x-auto hide-scrollbar border-b-2 border-kalahari/20 dark:border-stone-800 mb-8 sticky top-0 bg-off-white/95 dark:bg-stone-950/95 backdrop-blur-sm z-30 pt-4 transition-colors">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 font-black text-sm uppercase tracking-widest whitespace-nowrap border-b-4 transition-colors ${activeTab === 'overview' ? 'border-kalahari text-kalahari' : 'border-transparent text-olive/50 dark:text-white/40 hover:text-olive dark:hover:text-white'}`}
              >
                Overview & Camp
              </button>
              <button 
                onClick={() => setActiveTab('packages')}
                className={`px-6 py-4 font-black text-sm uppercase tracking-widest whitespace-nowrap border-b-4 transition-colors ${activeTab === 'packages' ? 'border-kalahari text-kalahari' : 'border-transparent text-olive/50 dark:text-white/40 hover:text-olive dark:hover:text-white'}`}
              >
                Hunting Packages <span className="ml-2 bg-kalahari/10 text-kalahari py-0.5 px-2 rounded-full text-xs">{hunts.length}</span>
              </button>
              <button 
                onClick={() => setActiveTab('gallery')}
                className={`px-6 py-4 font-black text-sm uppercase tracking-widest whitespace-nowrap border-b-4 transition-colors ${activeTab === 'gallery' ? 'border-kalahari text-kalahari' : 'border-transparent text-olive/50 dark:text-white/40 hover:text-olive dark:hover:text-white'}`}
              >
                Trophy Room
              </button>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-10 animate-in fade-in duration-300">
                
                <div className="prose dark:prose-invert max-w-none text-olive/80 dark:text-white/80 font-medium leading-relaxed transition-colors">
                  <h2 className="text-2xl font-black font-headline text-olive dark:text-white transition-colors">About Us</h2>
                  <p className="whitespace-pre-wrap">{outfitter.bio || "No biography provided yet."}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-stone-900 border border-kalahari/20 rounded-2xl p-6 shadow-sm transition-colors">
                    <Home className="h-8 w-8 text-kalahari mb-4" />
                    <h3 className="text-lg font-black text-olive dark:text-white mb-2 transition-colors">Accommodation</h3>
                    <p className="text-sm font-medium text-olive/70 dark:text-white/60 transition-colors">{outfitter.campType}</p>
                  </div>
                  <div className="bg-white dark:bg-stone-900 border border-kalahari/20 rounded-2xl p-6 shadow-sm transition-colors">
                    <Map className="h-8 w-8 text-kalahari mb-4" />
                    <h3 className="text-lg font-black text-olive dark:text-white mb-2 transition-colors">Hunting Terrain</h3>
                    <p className="text-sm font-medium text-olive/70 dark:text-white/60 transition-colors">{outfitter.terrain}</p>
                  </div>
                </div>

                {outfitter.accreditations && outfitter.accreditations.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-black font-headline text-olive dark:text-white mb-6 flex items-center gap-2 transition-colors">
                      <Medal className="h-6 w-6 text-kalahari" /> Professional Accreditations
                    </h2>
                    <div className="flex flex-wrap gap-4">
                      {outfitter.accreditations.map((badge: string, i: number) => (
                        <div key={i} className="bg-white dark:bg-stone-900 border border-kalahari/20 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm transition-colors">
                          <ShieldCheck className="h-5 w-5 text-green-500" />
                          <span className="font-bold text-sm text-olive dark:text-white transition-colors">{badge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'packages' && (
              <div className="animate-in fade-in duration-300">
                {hunts.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-stone-900 border-2 border-dashed border-kalahari/30 rounded-2xl transition-colors">
                    <Compass className="mx-auto h-12 w-12 text-kalahari/40 mb-4" />
                    <h3 className="text-xl font-black text-olive dark:text-white mb-2 transition-colors">No Active Packages</h3>
                    <p className="text-olive/70 dark:text-white/60 font-medium transition-colors">This outfitter is currently updating their inventory.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {hunts.map((hunt) => (
                      <Link href={`/hunts/${hunt.id}`} key={hunt.id} className="group flex flex-col bg-white dark:bg-stone-900 rounded-2xl border border-kalahari/20 overflow-hidden hover:border-kalahari hover:shadow-xl transition-all duration-300">
                        <div className="relative h-56 w-full bg-stone-100 dark:bg-stone-800 overflow-hidden transition-colors">
                          {hunt.coverImage || hunt.imageUrl ? (
                            <Image src={hunt.coverImage || hunt.imageUrl} alt={hunt.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-kalahari/30"><Compass className="h-12 w-12" /></div>
                          )}
                          {(hunt.price || hunt.basePrice) && (
                            <div className="absolute top-4 right-4 bg-olive/90 dark:bg-black/90 text-kalahari font-black px-3 py-1.5 rounded-lg text-sm flex items-center shadow-lg backdrop-blur-sm transition-colors">
                              <DollarSign className="h-4 w-4 mr-0.5" /> {(hunt.price || hunt.basePrice).toLocaleString()}
                            </div>
                          )}
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                          <h3 className="text-lg font-black font-headline text-olive dark:text-white mb-4 line-clamp-2 transition-colors">{hunt.title}</h3>
                          <div className="space-y-2 mt-auto pt-4 border-t border-kalahari/10 transition-colors">
                            <div className="flex items-center text-xs font-bold uppercase text-olive/70 dark:text-white/60 transition-colors"><MapPin className="h-4 w-4 mr-2 text-kalahari" /> {hunt.location}</div>
                            <div className="flex items-center text-xs font-bold uppercase text-olive/70 dark:text-white/60 transition-colors"><Calendar className="h-4 w-4 mr-2 text-kalahari" /> {hunt.duration} Days</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="animate-in fade-in duration-300">
                {outfitter.gallery.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-stone-900 border-2 border-dashed border-kalahari/30 rounded-2xl transition-colors">
                    <ImageIcon className="mx-auto h-12 w-12 text-kalahari/40 mb-4" />
                    <h3 className="text-xl font-black text-olive dark:text-white mb-2 transition-colors">Gallery Coming Soon</h3>
                    <p className="text-olive/70 dark:text-white/60 font-medium transition-colors">The outfitter is gathering their best photos.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {outfitter.gallery.map((img: string, i: number) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-kalahari/20 transition-colors">
                        <Image src={img} alt="Trophy Room" fill className="object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="sticky top-32 bg-white dark:bg-stone-900 border-2 border-kalahari/20 rounded-3xl p-6 shadow-xl mb-8 lg:mb-0 transition-colors">
              
              <div className="mb-6">
                <p className="text-sm font-bold text-olive/60 dark:text-white/50 uppercase tracking-widest mb-1 transition-colors">Pricing starts from</p>
                <div className="text-3xl font-black font-headline text-olive dark:text-white flex items-center transition-colors">
                  {startingPrice && startingPrice < 999999 ? (
                    <><DollarSign className="h-6 w-6 text-kalahari" /> {startingPrice.toLocaleString()}</>
                  ) : (
                    "Custom Pricing"
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {outfitter.isPro && (
                  <Button 
                    onClick={() => setIsQuoteModalOpen(true)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-6 text-base rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all"
                  >
                    Request Custom Quote
                  </Button>
                )}
                
                <MessageOutfitterButton 
                  outfitterId={outfitterId}
                  huntId="general_inquiry"
                  huntTitle="General Inquiry"
                  outfitterName={companyName}
                />
              </div>

              <div className="mt-8 pt-6 border-t border-kalahari/20 space-y-3 transition-colors">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-olive/70 dark:text-white/60 transition-colors">Response Rate</span>
                  <span className="font-bold text-olive dark:text-white transition-colors">100%</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-olive/70 dark:text-white/60 transition-colors">Response Time</span>
                  <span className="font-bold text-olive dark:text-white transition-colors">Within 24 Hours</span>
                </div>
              </div>
              
              <div className="mt-6 bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 flex items-start gap-3 border border-orange-200 dark:border-orange-800/50 transition-colors">
                <ShieldCheck className="h-5 w-5 text-orange-600 dark:text-orange-500 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-orange-900 dark:text-orange-400 transition-colors">
                  Payments made through Only-Hunts are secure and protected by our platform guarantee.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* NEW: Passed bookedDates down to the Modal */}
      <CustomQuoteModal 
        isOpen={isQuoteModalOpen} 
        onClose={() => setIsQuoteModalOpen(false)} 
        outfitterId={outfitterId}
        outfitterName={companyName}
        bookedDates={bookedDates}
      />
    </div>
  );
}