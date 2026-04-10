import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/ui/Footer"; // <-- IMPORTED FOOTER
import WhatsAppWidget from "@/components/ui/WhatsAppWidget"; 

export const metadata: Metadata = {
  title: "Only-Hunts",
  description: "Premium African Hunting Marketplace",
  manifest: "/manifest.json",
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
    // Added suppressHydrationWarning to prevent browser extension mismatch errors
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-olive text-off-white flex flex-col font-body">
        
        {/* --- GLOBAL SMART HEADER --- */}
        <Navbar />

        {/* --- MAIN PAGE CONTENT --- */}
        <main className="flex-grow flex flex-col">
          {children}
        </main>

        {/* --- GLOBAL FOOTER --- */}
        <Footer />

        {/* --- GLOBAL FLOATING WIDGETS --- */}
        <WhatsAppWidget />

      </body>
    </html>
  );
}