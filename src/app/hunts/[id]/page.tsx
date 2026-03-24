import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { adminDb } from '@/lib/firebase/admin';
import { ShieldCheck, MapPin, Target, Compass, ArrowLeft, User, Calendar, DollarSign, CheckCircle2, XCircle, PlusCircle } from 'lucide-react';

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  const { data: hunt } = await getHuntById(id);
  
  if (!hunt) {
    return { title: 'Hunt Not Found' };
  }
  
  const description = hunt.description 
    ? hunt.description.substring(0, 160) + '...'
    : `Book this premium hunting package in ${hunt.location || hunt.province || 'South Africa'} with ${hunt.outfitterName || 'a premier outfitter'}.`;

  return {
    title: `${hunt.title || 'Untitled Hunt'} | Only-Hunts`,
    description: description,
    openGraph: {
      title: hunt.title || 'Untitled Hunt',
      description: `Premium hunting in ${hunt.location || hunt.province || 'South Africa'}`,
      images: hunt.coverImage || hunt.imageUrl ? [hunt.coverImage || hunt.imageUrl] : [],
    },
  };
}

export default async function HuntDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  const { data: huntData, success } = await getHuntById(id);
  
  if (!success || !huntData) {
    notFound();
  }
  
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

  const displayImage = huntData.coverImage || huntData.imageUrl || (huntData.images && huntData.images[0]);
  const displayPrice = huntData.price || huntData.basePrice;

  return (
    <>
      <AnalyticsTracker huntId={huntData.id} />
      <div className="bg-off-white min-h-screen pb-16">
        
        {/* --- EDGE-TO-EDGE HERO BANNER (TOP BUTTON ACTUALLY REMOVED) --- */}
        <div className="w-full h-[45vh] md:h-[60vh] relative bg-olive overflow-hidden border-b-4 border-kalahari">
          {displayImage ? (
            <Image 
              src={displayImage} 
              alt={huntData.title || "Hunting Package"} 
              fill 
              className="object-cover opacity-90"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Compass className="h-24 w-24 text-kalahari/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        </div>

        {/* --- MAIN CONTENT (FULL WIDTH) --- */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 md:-mt-32 relative z-10 space-y-8">
          
          <div className="bg-white rounded-2xl shadow-xl border border-kalahari/10 p-6 sm:p-8 md:p-10">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                {huntData.status === "PENDING" && (
                  <span className="inline-block mb-3 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black px-3 py-1 rounded shadow-sm uppercase tracking-wide mr-2">
                    Pending Admin Approval
                  </span>
                )}
                <span className="inline-block mb-3 bg-olive/10 text-olive dark:text-off-white border border-olive/20 text-xs font-black px-3 py-1 rounded shadow-sm uppercase tracking-wide">
                  Verified Package
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-headline text-olive dark:text-off-white tracking-tight leading-tight">
                  {huntData.title || "Untitled Package"}
                </h1>
              </div>
              <ClientWishlistLoader huntId={huntData.id} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 mt-6 border-t border-kalahari/10">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-off-white border border-kalahari/20 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-kalahari" />
                </div>
                <div>
                  <p className="text-xs font-bold text-olive dark:text-off-white/50 uppercase tracking-widest">Location</p>
                  <p className="text-base font-bold text-olive dark:text-off-white">{huntData.location || huntData.province || "South Africa"}</p>
                </div>
              </div>
              
              {huntData.duration && (
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-off-white border border-kalahari/20 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-kalahari" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-olive dark:text-off-white/50 uppercase tracking-widest">Duration</p>
                    <p className="text-base font-bold text-olive dark:text-off-white">{huntData.duration} Days</p>
                  </div>
                </div>
              )}

              {huntData.primarySpecies && (
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-off-white border border-kalahari/20 flex items-center justify-center shrink-0">
                    <Target className="h-5 w-5 text-kalahari" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-olive dark:text-off-white/50 uppercase tracking-widest">Target Species</p>
                    <p className="text-base font-bold text-olive dark:text-off-white line-clamp-1">{huntData.primarySpecies}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {huntData.description && (
            <div className="bg-white rounded-2xl shadow-sm border border-kalahari/10 p-6 sm:p-8 md:p-10">
              <h2 className="text-xl font-black text-olive dark:text-off-white uppercase tracking-wide mb-6">Package Details</h2>
              <div className="prose max-w-none text-olive dark:text-off-white/80 font-medium leading-relaxed whitespace-pre-wrap">
                {huntData.description}
              </div>
            </div>
          )}

          {(huntData.includedItems || huntData.excludedItems) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {huntData.includedItems && (
                <div className="bg-green-50/30 rounded-2xl shadow-sm border border-green-100 p-6 sm:p-8">
                  <h3 className="text-sm font-black text-green-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" /> Included
                  </h3>
                  <div className="text-green-900/80 text-sm font-medium whitespace-pre-wrap leading-relaxed">
                    {huntData.includedItems}
                  </div>
                </div>
              )}
              {huntData.excludedItems && (
                <div className="bg-red-50/30 rounded-2xl shadow-sm border border-red-100 p-6 sm:p-8">
                  <h3 className="text-sm font-black text-red-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" /> Excluded
                  </h3>
                  <div className="text-red-900/80 text-sm font-medium whitespace-pre-wrap leading-relaxed">
                    {huntData.excludedItems}
                  </div>
                </div>
              )}
            </div>
          )}

          {huntData.additionalSpecies && (
            <div className="bg-white rounded-2xl shadow-sm border border-kalahari/10 p-6 sm:p-8 md:p-10">
              <h3 className="text-xl font-black text-olive dark:text-off-white uppercase tracking-wide mb-4 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-kalahari" /> Additional Species Available
              </h3>
              <div className="text-olive dark:text-off-white/80 text-sm font-medium whitespace-pre-wrap leading-relaxed bg-off-white p-6 rounded-xl border border-kalahari/10">
                {huntData.additionalSpecies}
              </div>
            </div>
          )}
        </div>

        {/* --- THE CHECK-OUT DESK (STRICT SIDE-BY-SIDE) --- */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-12">
          <div className="bg-white border-2 border-kalahari/20 shadow-xl rounded-3xl overflow-hidden">
            
            <div className="bg-olive py-6 px-8 text-center border-b-4 border-kalahari">
              <h2 className="text-2xl md:text-3xl font-black font-headline text-kalahari">Secure Your Dates</h2>
              <p className="text-off-white/70 font-medium mt-1">Submit a request to lock in this package directly with the outfitter.</p>
            </div>

            <div className="p-6 md:p-10">
              {/* This grid forces a 50/50 side-by-side split on desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                
                {/* Left Side: Outfitter, Price, VIP Deal */}
                <div className="space-y-8">
                  <div>
                    <p className="text-sm font-bold text-olive dark:text-off-white/50 uppercase tracking-widest mb-2">Total Package Price</p>
                    <div className="flex items-center text-4xl md:text-5xl font-black font-headline text-olive dark:text-off-white">
                      {displayPrice ? (
                        <>
                          <DollarSign className="h-8 w-8 text-kalahari mr-1" />
                          {displayPrice.toLocaleString()}
                        </>
                      ) : (
                        <span className="text-2xl">Contact for Price</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-kalahari/10">
                    <p className="text-xs text-olive dark:text-off-white/60 mb-4 font-bold uppercase tracking-wider">Offered by</p>
                    <Link href={`/outfitters/${huntData.outfitterId}`} className="flex items-center gap-4 group hover:bg-off-white p-3 -ml-3 rounded-xl transition-colors">
                      <div className="relative h-14 w-14 rounded-full border-2 border-kalahari/50 overflow-hidden bg-kalahari/20 shrink-0 shadow-sm transition-transform group-hover:scale-105 flex items-center justify-center">
                        {outfitterImage ? (
                          <Image src={outfitterImage} alt={huntData.outfitterName || "Outfitter"} fill className="object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-olive dark:text-off-white/30" />
                        )}
                      </div>
                      <div>
                        <div className="text-lg font-black font-headline text-olive dark:text-off-white group-hover:text-kalahari transition-colors flex items-center line-clamp-1">
                          {huntData.outfitterName || "Verified Outfitter"} <ShieldCheck className="ml-1.5 h-4 w-4 text-kalahari shrink-0" />
                        </div>
                        <p className="text-sm text-olive dark:text-off-white/60 font-medium group-hover:text-olive dark:text-off-white/80 transition-colors">View full profile</p>
                      </div>
                    </Link>

                    {/* NEW: MESSAGE BUTTON DROPPED HERE */}
                    <MessageOutfitterButton 
                      outfitterId={huntData.outfitterId}
                      huntId={huntData.id}
                      huntTitle={huntData.title || "Untitled Package"}
                      outfitterName={huntData.outfitterName || "Verified Outfitter"}
                    />
                  </div>

                  {/* VIP Deal sits right below the Outfitter Info on the left side */}
                  <div className="pt-2">
                    <OfferRedemptionBanner huntId={huntData.id} />
                  </div>
                </div>

                {/* Right Side: The Form */}
                <div className="bg-off-white p-6 rounded-2xl border border-kalahari/10 shadow-inner h-full">
                  <LeadForm
                    huntId={huntData.id}
                    outfitterId={huntData.outfitterId}
                    huntTitle={huntData.title || "Untitled Package"}
                  />
                </div>

              </div>
            </div>
          </div>

          {/* Centered Back to Marketplace */}
          <div className="mt-12 text-center">
            <Link href="/" className="inline-flex items-center font-bold text-olive dark:text-off-white hover:text-kalahari transition-colors pb-1 border-b-2 border-transparent hover:border-kalahari">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Marketplace
            </Link>
          </div>
        </div>

      </div>
    </>
  );
}