import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/ui/Footer"; 
import WhatsAppWidget from "@/components/ui/WhatsAppWidget"; 
import EndorsementBanner from "@/components/marketplace/EndorsementBanner"; 

export const metadata: Metadata = {
  title: "Only-Hunts",
  description: "Premium African Hunting Marketplace",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Only-Hunts",
  },
  icons: {
    apple: "/apple-icon.png", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
      </head>
      <body className="antialiased min-h-screen bg-olive text-off-white flex flex-col font-body">
        
        {/* --- GLOBAL SMART HEADER --- */}
        <Navbar />

        {/* --- MAIN PAGE CONTENT --- */}
        <main className="flex-grow flex flex-col">
          {children}
        </main>

        {/* --- GLOBAL PRE-FOOTER TRUST SIGNAL --- */}
        <EndorsementBanner />

        {/* --- GLOBAL FOOTER --- */}
        <Footer />

        {/* --- GLOBAL FLOATING WIDGETS --- */}
        <WhatsAppWidget />

      </body>
    </html>
  );
}