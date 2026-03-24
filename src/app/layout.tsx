import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider"; // <-- THIS IS THE MAGIC CONNECTION

export const metadata: Metadata = {
  title: "Only-Hunts",
  description: "Premium African Hunting Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Notice the dark:bg-olive added here so the background actually changes! */}
      <body className="antialiased min-h-screen bg-off-white text-olive dark:text-off-white dark:bg-olive dark:text-off-white flex flex-col font-body transition-colors duration-300">
        
        {/* WE MUST WRAP THE APP IN THE THEME PROVIDER */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          {/* --- GLOBAL SMART HEADER --- */}
          <Navbar />

          {/* --- MAIN PAGE CONTENT --- */}
          <main className="flex-grow flex flex-col">
            {children}
          </main>
        </ThemeProvider>

      </body>
    </html>
  );
}