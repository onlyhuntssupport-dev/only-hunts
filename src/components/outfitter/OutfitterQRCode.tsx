"use client";

import { useRef, useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

interface OutfitterQRCodeProps {
  outfitterId: string;
  companyName: string;
}

export default function OutfitterQRCode({ outfitterId, companyName }: OutfitterQRCodeProps) {
  const qrRef = useRef<SVGSVGElement>(null);
  const [profileUrl, setProfileUrl] = useState<string>("");
  
  useEffect(() => {
    // ALWAYS use the absolute, current window location origin.
    // This dynamically handles localhost:3000 in dev and https://www.only-hunts.com in production without hardcoding URLs.
    if (typeof window !== 'undefined') {
      setProfileUrl(`${window.location.origin}/outfitters/${outfitterId}`);
    }
  }, [outfitterId]);

  // Download logic for Print (Infinite scaling vector)
  const handleDownloadSVG = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${companyName.replace(/\s+/g, '-').toLowerCase()}-qr-code.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download logic for Web/Social Media (High-res PNG)
  const handleDownloadPNG = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width * 4;
      canvas.height = img.height * 4;
      if (ctx) {
        ctx.fillStyle = "white"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${companyName.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Prevent hydration errors by showing a loading skeleton until the URL is generated
  if (!profileUrl) {
    return (
      <div className="flex flex-col items-center justify-center bg-white dark:bg-black/40 p-6 md:p-8 rounded-2xl border-2 border-kalahari/20 shadow-md min-h-[400px]">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-800 h-64 w-64 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-white dark:bg-black/40 p-6 md:p-8 rounded-2xl border-2 border-kalahari/20 shadow-md transition-colors">
      <div className="text-center mb-6">
        <h3 className="text-xl font-black text-olive dark:text-off-white font-headline tracking-tight">Your Trade Show Beacon</h3>
        <p className="text-sm font-medium text-olive/70 dark:text-off-white/70 mt-2 max-w-xs">
          Hunters scan this to land directly on your public profile and request custom quotes.
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-inner border-2 border-gray-100 mb-8 transition-transform hover:scale-105 duration-300">
        <QRCodeSVG
          ref={qrRef}
          value={profileUrl}
          size={220}
          bgColor={"#ffffff"}
          fgColor={"#000000"}
          level={"H"} 
          imageSettings={{
            src: "/apple-icon.png", 
            x: undefined,
            y: undefined,
            height: 48,
            width: 48,
            excavate: true, 
          }}
        />
      </div>

      <div className="flex flex-col w-full gap-3">
        <Button 
          onClick={handleDownloadPNG} 
          className="w-full bg-kalahari hover:bg-kalahari/90 text-white font-black h-12 shadow-md transition-all"
        >
          <Download className="h-5 w-5 mr-2" /> Download Image (PNG)
        </Button>
        <Button 
          onClick={handleDownloadSVG} 
          variant="outline"
          className="w-full border-2 border-olive text-olive hover:bg-olive hover:text-white dark:border-off-white dark:text-off-white dark:hover:bg-off-white dark:hover:text-black font-black h-12 transition-colors"
        >
          <Printer className="h-5 w-5 mr-2" /> Download Vector (SVG)
        </Button>
      </div>
    </div>
  );
}