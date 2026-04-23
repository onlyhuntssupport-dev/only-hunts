"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import OutfitterQRCode from "@/components/outfitter/OutfitterQRCode";
import KuduLoader from "@/components/ui/KuduLoader";
import { Info, Map, Award } from "lucide-react";

// Dynamically import the PDF button to completely bypass server-side rendering
const CertificateDownloadBtn = dynamic(
  () => import("@/components/outfitter/CertificateDownloadBtn"),
  { ssr: false }
);

export default function TradeShowSpoorPage() {
  const [loading, setLoading] = useState(true);
  const [outfitterData, setOutfitterData] = useState<{ id: string; companyName: string; status: string } | null>(null);

  useEffect(() => {
    const fetchOutfitter = () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setOutfitterData({
                id: user.uid,
                companyName: data.companyName || "Your Outfitter Profile",
                // Normalize the string to uppercase to prevent case-sensitivity bugs
                status: data.status ? String(data.status).toUpperCase() : "PENDING"
              });
            }
          } catch (error) {
            console.error("Error fetching outfitter data:", error);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    };

    fetchOutfitter();
  }, []);

  if (loading) return <div className="p-10 flex justify-center"><KuduLoader /></div>;

  if (!outfitterData) {
    return (
      <div className="p-8 text-center text-olive dark:text-off-white font-bold">
        Error loading profile data. Please ensure your company name is set in Settings.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-black font-headline text-olive dark:text-off-white flex items-center gap-3">
          <Map className="h-8 w-8 text-kalahari" />
          Trade Show Spoor
        </h1>
        <p className="text-olive/70 dark:text-off-white/70 font-medium mt-2">
          Your digital tracking tools for international hunting conventions and expos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: The QR Code Component */}
        <div className="lg:col-span-2">
          <OutfitterQRCode 
            outfitterId={outfitterData.id} 
            companyName={outfitterData.companyName} 
          />
        </div>

        {/* Right Column: Certificates & Best Practices */}
        <div className="space-y-6">
          
          {/* Certificate Generation Card */}
          <div className="bg-black/5 dark:bg-off-white/5 border-2 border-kalahari/30 rounded-xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-kalahari/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <h3 className="flex items-center gap-2 text-lg font-black font-headline text-olive dark:text-off-white mb-2">
              <Award className="h-5 w-5 text-kalahari" /> Verified Certificate
            </h3>
            
            <p className="text-sm font-medium text-olive/70 dark:text-off-white/70 mb-5">
              Generate a high-resolution PDF certificate proving your authorized status on the Only-Hunts platform. Print and frame for your booth.
            </p>

            {outfitterData.status === "VERIFIED" ? (
              <CertificateDownloadBtn outfitterName={outfitterData.companyName} />
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">
                  Account Verification Pending
                </p>
              </div>
            )}
          </div>

          {/* Best Practices & Tips */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-kalahari p-5 rounded-r-xl shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-black text-orange-900 dark:text-orange-400 uppercase tracking-wider mb-3">
              <Info className="h-4 w-4" /> Best Practices
            </h3>
            <ul className="space-y-3 text-sm font-medium text-orange-900/80 dark:text-orange-200/80">
              <li className="flex items-start gap-2">
                <span className="text-kalahari font-black mt-0.5">•</span>
                <strong>Banners & Print:</strong> Always download the Vector (SVG) format for your printing company. It scales infinitely without blurring.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-kalahari font-black mt-0.5">•</span>
                <strong>Digital Sharing:</strong> Use the Image (PNG) format to send via WhatsApp, email, or post on your social media.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-kalahari font-black mt-0.5">•</span>
                <strong>The Pitch:</strong> Tell hunters, "Scan this to see my lodge and trophy list instantly."
              </li>
              <li className="flex items-start gap-2">
                <span className="text-kalahari font-black mt-0.5">•</span>
                <strong>The Certificate:</strong> Print your certificate on premium, heavy-stock A4 paper for maximum authority.
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}