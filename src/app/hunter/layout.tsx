"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Heart, CalendarCheck, User, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import LogoutButton from '@/components/auth/LogoutButton';
import KuduLoader from '@/components/ui/KuduLoader';
import { NotificationPrompt } from "@/components/ui/NotificationPrompt";
import SupportModal from '@/components/support/SupportModal';

const navLinks = [
  { href: "/hunter/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/hunter/dashboard/wishlist", label: "My Wishlist", icon: Heart },
  { href: "/hunter/dashboard/bookings", label: "My Bookings", icon: CalendarCheck },
  { href: "/hunter/dashboard/settings", label: "Profile Settings", icon: User }, 
];

export default function HunterLayout({ children }: { children: React.ReactNode; }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- THE BOUNCER ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthorized(true);
        setLoading(false);
      } else {
        router.replace("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white dark:bg-olive flex items-center justify-center transition-colors">
        <KuduLoader />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-off-white dark:bg-olive transition-colors duration-300">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden border-r-2 border-kalahari/30 dark:border-kalahari/20 bg-off-white dark:bg-black/20 md:block transition-colors">
        <div className="flex h-full max-h-screen flex-col gap-2">
          
          {/* Logo Area */}
          <div className="flex h-20 items-center border-b-2 border-kalahari/30 dark:border-kalahari/20 px-4 lg:px-6 bg-olive dark:bg-black/40 transition-colors">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 flex items-center justify-center rounded overflow-hidden relative drop-shadow-[0_0_10px_rgba(249,115,22,0.5)] group-hover:scale-105 transition-transform duration-300">
                <Image 
                  src="/logo-transparent.png" 
                  alt="Only-Hunts Logo" 
                  fill 
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-off-white font-headline font-bold text-xl tracking-wide group-hover:text-kalahari transition-colors">
                Only-Hunts
              </span>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <div className="flex-1 mt-6 overflow-y-auto">
            <nav className="grid items-start px-2 text-sm font-bold lg:px-4 gap-1.5">
              {navLinks.map((link: any) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-olive dark:text-off-white/70 transition-all hover:text-olive dark:hover:text-kalahari hover:bg-kalahari/20 dark:hover:bg-kalahari/10"
                >
                  <link.icon className="h-5 w-5 shrink-0" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Support & Logout Area */}
          <div className="mt-auto p-4 border-t-2 border-kalahari/30 dark:border-kalahari/20 transition-colors flex flex-col gap-2">
            <SupportModal />
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT & MOBILE HEADER --- */}
      <div className="flex flex-col">
        
        {/* Mobile Header */}
        <header className="flex h-16 items-center gap-4 border-b-2 border-kalahari/30 dark:border-kalahari/20 bg-olive dark:bg-black/40 px-4 md:hidden transition-colors">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden bg-transparent border-kalahari text-kalahari hover:bg-kalahari/10"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-off-white dark:bg-olive border-r-2 border-kalahari/30 dark:border-kalahari/20 transition-colors">
              <nav className="grid gap-2 text-lg font-bold mt-6">
                
                <Link href="/" className="flex items-center gap-3 mb-8 px-3 group">
                  <div className="h-10 w-10 flex items-center justify-center rounded overflow-hidden relative drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                    <Image 
                      src="/logo-transparent.png" 
                      alt="Only-Hunts Logo" 
                      fill 
                      className="object-contain"
                    />
                  </div>
                  <span className="text-olive dark:text-off-white font-headline font-bold text-xl tracking-wide transition-colors group-hover:text-kalahari">
                    Only-Hunts
                  </span>
                </Link>
                
                {/* Mobile Links */}
                {navLinks.map((link: any) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-3 text-olive dark:text-off-white/70 hover:text-olive dark:hover:text-kalahari hover:bg-kalahari/20 dark:hover:bg-kalahari/10 transition-colors"
                  >
                    <link.icon className="h-5 w-5 shrink-0" />
                    {link.label}
                  </Link>
                ))}
              </nav>
              
              <div className="mt-auto mb-4 flex flex-col gap-2">
                <SupportModal />
                <LogoutButton />
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 transition-colors">
          <NotificationPrompt />
          {children}
        </main>
      </div>
    </div>
  );
}