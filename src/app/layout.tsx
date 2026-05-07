import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/ui/Footer"; 
import WhatsAppWidget from "@/components/ui/WhatsAppWidget"; 
import EndorsementBanner from "@/components/marketplace/EndorsementBanner"; 

export const metadata: Metadata = {
  metadataBase: new URL('https://only-hunts.com'),
  title: {
    default: "Only-Hunts | Premium African Hunting Marketplace",
    template: "%s | Only-Hunts"
  },
  description: "Book your next global hunting safari directly with verified professional outfitters. Transparent pricing, secure payments, and world-class destinations.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Only-Hunts",
  },
  openGraph: {
    title: "Only-Hunts | Premium African Hunting Marketplace",
    description: "Book your next global hunting safari directly with verified professional outfitters.",
    url: "https://only-hunts.com",
    siteName: "Only-Hunts",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: 'https://only-hunts.com/opengraph-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Only-Hunts Premium African Hunting Marketplace',
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Only-Hunts",
    description: "Book your next global hunting safari directly with verified professional outfitters.",
    images: ['https://only-hunts.com/opengraph-image.jpg'],
  }
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
      <body className="antialiased min-h-screen bg-olive text-off-white flex flex-col font-body" suppressHydrationWarning>
        
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