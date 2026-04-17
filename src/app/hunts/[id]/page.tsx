import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { adminDb } from '@/lib/firebase/admin';
import { ShieldCheck, MapPin, Target, Compass, ArrowLeft, User, Calendar, DollarSign, CheckCircle2, XCircle, PlusCircle, LayoutGrid, ArrowRight } from 'lucide-react';

// Custom Components
import ClientWishlistLoader from '@/components/marketplace/ClientWishlistLoader';
import AnalyticsTracker from '@/components/marketplace/AnalyticsTracker';
import LeadForm from '@/components/marketplace/LeadForm';
import OfferRedemptionBanner from '@/components/marketplace/OfferRedemptionBanner';
import MessageOutfitterButton from '@/components/marketplace/MessageOutfitterButton';
import { getHuntById } from '@/app/actions/hunts';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  const rawResponse = await getHuntById(id);
  // OVERRIDE: Tell TypeScript to trust our data structure
  const hunt = rawResponse.data as any; 
  
  if (!hunt) {
    return { title: 'Hunt Not Found | Only-Hunts' };
  }
  
  // Safely inherit previous images for fallbacks
  const previousImages = (await parent).openGraph?.images || [];
  const coverImg = hunt.coverImage || hunt.imageUrl;
  
  const description = hunt.description 
    ? hunt.description.substring(0, 160) + (hunt.description.length > 160 ? '...' : '')
    : `Book this premium hunting package in ${hunt.location || hunt.province || 'South Africa'} with ${hunt.outfitterName || 'a premier outfitter'}.`;

  const displayPrice = hunt.price || hunt.basePrice;
  const ogTitle = displayPrice 
    ? `${hunt.title || 'Untitled Hunt'} - $${displayPrice.toLocaleString()}`
    : `${hunt.title || 'Untitled Hunt'} | Only-Hunts`;

  return {
    title: `${hunt.title || 'Untitled Hunt'} | Only-Hunts`,
    description: description,
    openGraph: {
      title: ogTitle,
      description: description,
      url: `https://only-hunts.com/hunts/${id}`,
      siteName: 'Only-Hunts Marketplace',
      images: coverImg ? [
        {
          url: coverImg,
          width: 1200,
          height: 630,
          alt: hunt.title || 'Safari Package',
        },
        ...previousImages
      ] : previousImages,
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: description,
      images: coverImg ? [coverImg] : [],
    },
  };
}

export default async function HuntDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  const response = await getHuntById(id);
  // OVERRIDE: Bypass the strict Type inference for the Firebase fetch
  const success = response.success;
  const huntData = response.data as any; 
  
  if (!success || !huntData) {
    notFound();
  }
  
  // 1. Fetch Outfitter Profile Image
  let outfitterImage = null;
  if (huntData.outfitterId) {
    try {
      const outfitterDoc = await adminDb.collection('users').doc(huntData.outfitterId).get();
      if (outfitterDoc.exists) {
        outfitterImage = outfitterDoc.data()?.profileImageUrl;
      }
    } catch (error) {
      console.error("Error fetching outfitter profile:", error);
    }
  }

  // 2. Fetch More Packages from this Outfitter
  let otherPackages: any[] = [];
  if (huntData.outfitterId) {
    try {
      const otherHuntsSnapshot = await adminDb.collection('hunts')
        .where('outfitterId', '==', huntData.outfitterId)
        .where('status', '==', 'APPROVED')
        .limit(4) // Fetch 4 in case one is the current package
        .get();
        
      otherPackages = otherHuntsSnapshot.docs
        // OVERRIDE: Cast the related packages as well
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter((h: any) => h.id !== huntData.id) // Exclude current package
        .slice(0, 3); // Keep only up to 3
    } catch (error) {
      console.error("Error fetching other packages:", error);
    }
  }

  // Aggregate all possible images for the gallery
  const allImages: string[] = [];
  if (huntData.coverImage) allImages.push(huntData.coverImage);
  if (huntData.imageUrl && huntData.imageUrl !== huntData.coverImage) allImages.push(huntData.imageUrl);
  if (huntData.images && Array.isArray(huntData.images)) {
    huntData.images.forEach((img: string) => {
      if (!allImages.includes(img)) allImages.push(img);
    });
  }

  const displayPrice = huntData.price || huntData.basePrice;

  return (
    <div className="relative min-h-screen bg-olive">
      <AnalyticsTracker huntId={huntData.id} />
      
      {/* --- FIXED FULLSCREEN BACKGROUND --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-[position:center_top] bg-no-repeat opacity-40"
          style={{ backgroundImage: "url('/watering-hole.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-olive/80 to-olive"></div>
      </div>

      {/* --- MAIN SCROLLING CONTENT --- */}
      <div className="relative z-10 pb-24 text-off-white font-body pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top Bar: Back Button & Title */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <Link href="/marketplace" className="inline-flex items-center text-sm font-bold text-kalahari hover:text-white transition-colors mb-4 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-kalahari/20">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Marketplace
              </Link>
              <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tight drop-shadow-md">
                {huntData.title || "Untitled Package"}
              </h1>
              <div className="flex items-center gap-4 mt-3 text-sm font-bold text-off-white/80 drop-shadow-sm">
                <span className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-kalahari" /> {huntData.location || huntData.province || "South Africa"}</span>
                {huntData.promoTier === "FEATURED" && (
                  <span className="bg-kalahari text-olive px-2 py-0.5 rounded text-[10px] uppercase tracking-widest flex items-center shadow-sm">Featured</span>
                )}
              </div>
            </div>
            <ClientWishlistLoader huntId={huntData.id} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            
            {/* LEFT COLUMN MAIN WRAPPER (Spans 2 cols) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* --- SIDE-BY-SIDE SPLIT --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 1. HALF WIDTH IMAGE GALLERY */}
                <div className="h-full w-full">
                  {allImages.length > 0 ? (
                    <div className="relative w-full h-full min-h-[500px] rounded-3xl overflow-hidden flex flex-col gap-2 border-2 border-kalahari/20 shadow-xl bg-black">
                      {/* Main Feature Image (Top) */}
                      <div className={`relative w-full ${allImages.length > 1 ? 'h-2/3' : 'h-full'}`}>
                        <Image src={allImages[0]} alt="Featured Safari Image" fill className="object-cover" priority />
                      </div>
                      
                      {/* Secondary Grid (Bottom Split) */}
                      {allImages.length > 1 && (
                        <div className="flex gap-2 w-full h-1/3">
                          <div className="relative h-full w-1/2">
                            <Image src={allImages[1]} alt="Safari Detail" fill className="object-cover" />
                          </div>
                          <div className="relative h-full w-1/2 group">
                            {allImages[2] ? (
                              <Image src={allImages[2]} alt="Safari Detail" fill className="object-cover" />
                            ) : (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center border border-kalahari/20">
                                 <Compass className="h-10 w-10 text-kalahari/30" />
                              </div>
                            )}
                            {allImages.length > 3 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer hover:bg-black/80 transition-colors backdrop-blur-sm">
                                <span className="text-white text-sm font-bold flex items-center gap-2"><LayoutGrid className="w-5 h-5"/> +{allImages.length - 3}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                     <div className="w-full h-full min-h-[500px] bg-black/30 rounded-3xl border-2 border-dashed border-kalahari/20 flex items-center justify-center shadow-inner">
                       <Compass className="h-16 w-16 text-kalahari/30" />
                     </div>
                  )}
                </div>

                {/* 2. HALF WIDTH PACKAGE DETAILS */}
                <div className="bg-black/20 backdrop-blur-md rounded-3xl border border-kalahari/20 p-6 shadow-lg h-full overflow-y-auto">
                  
                  {/* Quick Specs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-kalahari/20 mb-6">
                    {huntData.duration && (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-kalahari uppercase tracking-widest mb-1">Duration</span>
                        <span className="text-base font-black flex items-center"><Calendar className="w-4 h-4 mr-2 text-off-white/50" /> {huntData.duration} Days</span>
                      </div>
                    )}
                    {huntData.primarySpecies && (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-kalahari uppercase tracking-widest mb-1">Target Species</span>
                        <span className="text-base font-black flex items-center line-clamp-1"><Target className="w-4 h-4 mr-2 text-off-white/50" /> {huntData.primarySpecies}</span>
                      </div>
                    )}
                    <div className="flex flex-col sm:col-span-2">
                      <span className="text-xs font-bold text-kalahari uppercase tracking-widest mb-1">Location</span>
                      <span className="text-base font-black flex items-center line-clamp-1"><MapPin className="w-4 h-4 mr-2 text-off-white/50" /> {huntData.province || "South Africa"}</span>
                    </div>
                  </div>

                  {/* The Description */}
                  {huntData.description && (
                    <div className="mb-8">
                      <h2 className="text-xl font-black font-headline text-white mb-3">The Experience</h2>
                      <div className="prose prose-invert prose-sm max-w-none text-off-white/80 font-medium leading-relaxed whitespace-pre-wrap">
                        {huntData.description}
                      </div>
                    </div>
                  )}

                  {/* What's Included / Excluded */}
                  {(huntData.includedItems || huntData.excludedItems) && (
                    <div className="flex flex-col gap-4">
                      {huntData.includedItems && (
                        <div className="bg-black/30 p-4 rounded-xl border border-kalahari/10">
                          <h3 className="text-xs font-black text-kalahari uppercase tracking-widest mb-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" /> Included
                          </h3>
                          <div className="text-off-white/70 text-xs font-medium whitespace-pre-wrap leading-relaxed">
                            {huntData.includedItems}
                          </div>
                        </div>
                      )}
                      {huntData.excludedItems && (
                        <div className="bg-black/30 p-4 rounded-xl border border-red-900/20">
                          <h3 className="text-xs font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <XCircle className="h-4 w-4" /> Excluded
                          </h3>
                          <div className="text-off-white/70 text-xs font-medium whitespace-pre-wrap leading-relaxed">
                            {huntData.excludedItems}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Additional Species */}
                  {huntData.additionalSpecies && (
                    <div className="mt-6 pt-6 border-t border-kalahari/20">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                        <PlusCircle className="h-4 w-4 text-kalahari" /> Additional Species
                      </h3>
                      <div className="text-off-white/70 text-xs font-medium whitespace-pre-wrap leading-relaxed">
                        {huntData.additionalSpecies}
                      </div>
                    </div>
                  )}
                </div>

              </div> {/* END SIDE-BY-SIDE SPLIT */}

              {/* FULL WIDTH CARD 2: Meet The Outfitter */}
              <div className="bg-gradient-to-br from-black/60 to-black/30 backdrop-blur-md border-2 border-kalahari/30 rounded-3xl p-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <ShieldCheck className="w-40 h-40 text-kalahari" />
                </div>
                
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10 text-center md:text-left">
                  <div className="relative h-24 w-24 rounded-full border-4 border-kalahari overflow-hidden bg-black shrink-0 shadow-lg">
                    {outfitterImage ? (
                      <Image src={outfitterImage} alt={huntData.outfitterName || "Outfitter"} fill className="object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-off-white/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-kalahari uppercase tracking-widest mb-1">Hosted By</p>
                    <div className="text-2xl md:text-3xl font-black font-headline text-white flex items-center justify-center md:justify-start mb-2">
                      {huntData.outfitterName || "Verified Outfitter"} 
                      <ShieldCheck className="ml-2 h-6 w-6 text-green-500 shrink-0 drop-shadow-md" />
                    </div>
                    <p className="text-sm text-off-white/70 font-medium max-w-md">
                      A premium, verified outfitter operating on the Only-Hunts platform. Book with confidence.
                    </p>
                  </div>
                </div>
                
                <div className="shrink-0 relative z-10 w-full md:w-auto">
                  <Link href={`/outfitters/${huntData.outfitterId}`} className="flex items-center justify-center bg-off-white hover:bg-white text-olive font-black px-6 py-3 rounded-xl transition-all shadow-md w-full md:w-auto">
                    View Profile <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* FULL WIDTH CARD 3: More From This Outfitter */}
              {otherPackages.length > 0 && (
                <div className="pt-6">
                  <h3 className="text-xl font-black font-headline text-white mb-6 flex items-center">
                    More from {huntData.outfitterName || "this Outfitter"}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {otherPackages.map((pkg: any) => (
                      <Link href={`/hunts/${pkg.id}`} key={pkg.id} className="group bg-black/30 backdrop-blur-sm border border-kalahari/20 rounded-2xl overflow-hidden hover:border-kalahari/60 transition-colors block">
                        <div className="relative h-32 w-full bg-black/50">
                          {(pkg.coverImage || pkg.imageUrl) ? (
                            <Image src={pkg.coverImage || pkg.imageUrl} alt={pkg.title || "Safari Package"} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <Compass className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-off-white/20" />
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="text-sm font-bold text-white line-clamp-2 mb-2 group-hover:text-kalahari transition-colors">{pkg.title || "Untitled Package"}</h4>
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-[10px] font-bold text-off-white/50 uppercase tracking-widest flex items-center"><Calendar className="w-3 h-3 mr-1" /> {pkg.duration || "?"} D</span>
                            {(pkg.price || pkg.basePrice) && (
                              <span className="text-xs font-black text-kalahari flex items-center"><DollarSign className="w-3 h-3" /> {(pkg.price || pkg.basePrice).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: Standard Checkout Card (Spans 1 col) */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                
                {/* Main Pricing & Booking Card */}
                <div className="bg-black/60 border-2 border-kalahari/40 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                  
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-kalahari uppercase tracking-widest mb-2">Total Package Price</p>
                    <div className="flex items-center text-4xl md:text-5xl font-black font-headline text-white mb-6 drop-shadow-md">
                      {displayPrice ? (
                        <>
                          <DollarSign className="h-8 w-8 md:h-10 md:w-10 text-kalahari mr-1" />
                          {displayPrice.toLocaleString()}
                        </>
                      ) : (
                        <span className="text-2xl">Contact for Price</span>
                      )}
                    </div>

                    {huntData.status === "PENDING" && (
                      <div className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-black p-3 rounded-xl mb-6 text-center uppercase tracking-wide shadow-inner">
                        Pending Admin Approval
                      </div>
                    )}

                    <div className="mb-6">
                      <OfferRedemptionBanner huntId={huntData.id} />
                    </div>

                    <div className="space-y-4">
                       <LeadForm
                        huntId={huntData.id}
                        outfitterId={huntData.outfitterId}
                        huntTitle={huntData.title || "Untitled Package"}
                      />
                      
                      <div className="pt-2">
                        <MessageOutfitterButton 
                          outfitterId={huntData.outfitterId}
                          huntId={huntData.id}
                          huntTitle={huntData.title || "Untitled Package"}
                          outfitterName={huntData.outfitterName || "Verified Outfitter"}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Guarantees */}
                <div className="bg-black/40 border border-kalahari/20 rounded-2xl p-6 text-center backdrop-blur-sm">
                  <ShieldCheck className="w-10 h-10 text-kalahari mx-auto mb-3 opacity-80 drop-shadow-sm" />
                  <p className="text-sm font-black text-white uppercase tracking-widest mb-2">Only-Hunts Guarantee</p>
                  <p className="text-xs text-off-white/70 font-medium leading-relaxed">Your inquiry is sent directly to the verified outfitter. Secure, transparent booking with zero hidden platform fees.</p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}