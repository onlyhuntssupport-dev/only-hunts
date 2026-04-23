"use client";

import React, { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import CertificateTemplate from "@/components/ui/CertificateTemplate";
import { FileBadge, Loader2 } from "lucide-react";

interface CertificateDownloadBtnProps {
  outfitterName: string;
}

export default function CertificateDownloadBtn({ outfitterName }: CertificateDownloadBtnProps) {
  const [isClient, setIsClient] = useState(false);
  const currentYear = new Date().getFullYear();

  // Prevents SSR hydration mismatch by ensuring this only renders in the browser
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <button disabled className="inline-flex items-center justify-center bg-olive/50 text-off-white/50 font-black px-6 py-3 rounded-xl w-full sm:w-auto cursor-not-allowed">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Initializing Engine...
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={<CertificateTemplate outfitterName={outfitterName} verificationYear={currentYear} />}
      fileName={`Only-Hunts_Verified_${currentYear}_${outfitterName.replace(/\s+/g, '_')}.pdf`}
      className="inline-flex items-center justify-center bg-orange-600 hover:bg-orange-500 text-white font-black px-6 py-3 rounded-xl transition-all shadow-lg hover:-translate-y-0.5 w-full border-2 border-orange-500/50"
    >
      {({ loading }) => (
        <>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <FileBadge className="mr-2 h-5 w-5" />
              Download A4 Certificate
            </>
          )}
        </>
      )}
    </PDFDownloadLink>
  );
}