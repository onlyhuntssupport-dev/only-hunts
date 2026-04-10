import Link from "next/link";
import Image from "next/image";
import { adminDb } from "@/lib/firebase/admin";
import { ShieldCheck, MapPin, Search, AlertCircle, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface OutfitterCard {
  id: string;
  companyName: string;
  location: string;
  profileImageUrl: string;
}

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getVerifiedOutfitters(): Promise<OutfitterCard[]> {
  try {
    const usersRef = adminDb.collection("users");
    
    const [uppercaseSnapshot, lowercaseSnapshot] = await Promise.all([
      usersRef.where("role", "==", "OUTFITTER").where("verificationStatus", "==", "VERIFIED").get(),
      usersRef.where("role", "==", "outfitter").where("verificationStatus", "==", "VERIFIED").get()
    ]);

    const combinedDocs = [...uppercaseSnapshot.docs, ...lowercaseSnapshot.docs];
    const uniqueDocs = Array.from(new Map(combinedDocs.map(doc => [doc.id, doc])).values());

    return uniqueDocs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        companyName: data.companyName || data.name || "Verified Outfitter",
        location: data.location || "South Africa",
        profileImageUrl: data.profileImageUrl || "",
      };
    }).sort((a, b) => a.companyName.localeCompare(b.companyName)); 

  } catch (error) {
    console.error("Error fetching verified outfitters:", error);
    return [];
  }
}

export default async function OutfittersDirectoryPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const searchQuery = typeof resolvedParams.q === 'string' ? resolvedParams.q.toLowerCase() : '';

  const allOutfitters = await getVerifiedOutfitters();

  const filteredOutfitters = allOutfitters.filter((outfitter) => {
    if (!searchQuery) return true;
    const searchableText = `${outfitter.companyName} ${outfitter.location}`.toLowerCase();
    return searchableText.includes(searchQuery);
  });

  return (
    <div className="relative min-h-screen bg-black">
      
      {/* --- FIXED PARALLAX BACKGROUND --- */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/buffalo-bg.jpg"
          alt="Cape Buffalo"
          fill
          priority
          quality={90}
          className="object-cover object-center opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80" />
      </div>

      {/* --- PAGE CONTENT --- */}
      <div className="relative z-10 flex flex-col items-center min-h-screen p-6 pb-24">
        
        {/* Header Section */}
        <div className="max-w-4xl w-full text-center mt-24 mb-12">
          <div className="inline-flex items-center gap-2 bg-kalahari/20 text-kalahari border border-kalahari/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-sm">
            <ShieldCheck className="h-4 w-4" /> Trusted Professionals
          </div>
          <h1 className="text-5xl md:text-7xl font-black font-headline text-white drop-shadow-lg mb-6 uppercase tracking-wide">
            Elite Outfitters
          </h1>
          <p className="text-lg md:text-xl font-medium text-off-white/90 max-w-2xl mx-auto drop-shadow-md">
            Browse our complete network of vetted hunting professionals. Every outfitter listed here has had their permits and licenses verified by the Only-Hunts team.
          </p>
        </div>

        <div className="w-full max-w-7xl">
          {/* Search Bar */}
          <div className="bg-white/10 dark:bg-black/60 backdrop-blur-md border border-white/20 dark:border-kalahari/30 rounded-2xl p-4 shadow-xl mb-12 max-w-3xl mx-auto">
            <form action="/outfitters" method="GET" className="flex items-center gap-3">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-off-white/60" />
                </div>
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search by outfitter name or location..."
                  className="w-full pl-11 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-off-white/50 focus:ring-2 focus:ring-kalahari outline-none transition-all font-medium"
                />
              </div>
              <button 
                type="submit"
                className="bg-kalahari hover:bg-kalahari/90 text-olive font-black px-6 py-3 rounded-xl shadow-md transition-colors shrink-0"
              >
                Search
              </button>
            </form>
          </div>

          <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-2xl font-headline font-black text-white">
              Directory Results
            </h2>
            <span className="bg-kalahari/20 text-kalahari border border-kalahari/30 font-bold px-3 py-1 rounded-full text-sm">
              {filteredOutfitters.length} Found
            </span>
          </div>

          {/* Directory Grid */}
          {filteredOutfitters.length === 0 ? (
            <div className="text-center py-20 bg-white/5 backdrop-blur-md border-2 border-dashed border-white/20 rounded-2xl shadow-sm">
              <AlertCircle className="mx-auto h-12 w-12 text-kalahari/60 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Outfitters Found</h3>
              <p className="text-off-white/70 max-w-md mx-auto mb-6 font-medium">
                We couldn't find any verified outfitters matching "{searchQuery}". Try a different location or name.
              </p>
              <Link href="/outfitters" className="inline-block bg-kalahari hover:bg-kalahari/90 text-olive font-bold px-6 py-3 rounded-xl transition-colors">
                Clear Search
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredOutfitters.map((outfitter) => (
                <div 
                  key={outfitter.id}
                  className="flex flex-col bg-white/5 dark:bg-black/40 backdrop-blur-md border border-white/10 dark:border-kalahari/30 rounded-2xl overflow-hidden hover:border-kalahari/50 transition-all duration-300 group"
                >
                  <div className="h-40 bg-olive/80 relative flex flex-col items-center justify-center border-b border-white/10 p-4">
                    <div className="relative h-20 w-20 rounded-full border-2 border-kalahari shadow-md overflow-hidden bg-black/50 flex items-center justify-center shrink-0 mb-2 z-10">
                      {outfitter.profileImageUrl ? (
                        <Image src={outfitter.profileImageUrl} alt={outfitter.companyName} fill className="object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-kalahari/50" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-kalahari/30 z-10">
                      <ShieldCheck className="h-3.5 w-3.5 text-kalahari" />
                      <span className="text-white text-[10px] font-bold uppercase tracking-wider">Verified</span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow items-center text-center">
                    <h3 className="text-2xl font-black text-white mb-2 font-headline line-clamp-1 w-full">{outfitter.companyName}</h3>
                    <div className="flex items-center gap-2 text-off-white/70 mb-6 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-kalahari" />
                      <span className="truncate">{outfitter.location}</span>
                    </div>
                    <Link href={`/outfitters/${outfitter.id}`} className="w-full mt-auto">
                      <Button className="w-full bg-kalahari hover:bg-kalahari/80 text-olive font-bold">
                        View Profile <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}