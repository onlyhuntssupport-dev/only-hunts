"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Package, Users, Settings, Menu, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import LogoutButton from '@/components/auth/LogoutButton';

const navLinks = [
  { href: "/outfitter/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/outfitter/dashboard/hunts", label: "My Hunts", icon: Package },
  { href: "/outfitter/dashboard/leads", label: "Inquiries", icon: Users },
  { href: "/outfitter/dashboard/settings", label: "Business Profile", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode; }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- THE BOUNCER: Checks if user is logged in before showing the dashboard ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthorized(true);
        setLoading(false);
      } else {
        // If they are not logged in, kick them to the registration page instantly
        router.replace("/outfitter/register");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Show a loading spinner while the bouncer checks their ID
  if (loading) {
    return (
      <div className="min-h-screen bg-off-white dark:bg-olive flex items-center justify-center transition-colors">
        <Loader2 className="animate-spin h-12 w-12 text-kalahari" />
      </div>
    );
  }

  // Double security: render absolutely nothing if unauthorized
  if (!isAuthorized) return null;

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-off-white dark:bg-olive transition-colors duration-300">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden border-r-2 border-kalahari/30 dark:border-kalahari/20 bg-off-white dark:bg-black/20 md:block transition-colors">
        <div className="flex h-full max-h-screen flex-col gap-2">
          
          {/* Logo Area */}
          <div className="flex h-20 items-center border-b-2 border-kalahari/30 dark:border-kalahari/20 px-4 lg:px-6 bg-olive dark:bg-black/40 transition-colors">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="bg-kalahari text-olive dark:text-off-white font-bold font-headline h-8 w-8 flex items-center justify-center rounded shadow-sm text-lg">
                OH
              </div>
              <span className="text-off-white font-headline font-bold text-xl tracking-wide">
                Only-Hunts
              </span>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <div className="flex-1 mt-6">
            <nav className="grid items-start px-2 text-sm font-bold lg:px-4 gap-1.5">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-olive dark:text-off-white/70 dark:text-off-white/60 transition-all hover:text-olive dark:text-off-white dark:hover:text-kalahari hover:bg-kalahari/20 dark:hover:bg-kalahari/10"
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Logout Area */}
          <div className="mt-auto p-4 border-t-2 border-kalahari/30 dark:border-kalahari/20 transition-colors">
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
                
                {/* Mobile Logo */}
                <Link href="/" className="flex items-center gap-3 mb-8 px-3">
                  <div className="bg-kalahari text-olive dark:text-off-white font-bold font-headline h-8 w-8 flex items-center justify-center rounded shadow-sm text-lg">
                    OH
                  </div>
                  <span className="text-olive dark:text-off-white dark:text-off-white font-headline font-bold text-xl tracking-wide transition-colors">
                    Only-Hunts
                  </span>
                </Link>
                
                {/* Mobile Links */}
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-3 text-olive dark:text-off-white/70 dark:text-off-white/60 hover:text-olive dark:text-off-white dark:hover:text-kalahari hover:bg-kalahari/20 dark:hover:bg-kalahari/10 transition-colors"
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto mb-4">
                <LogoutButton />
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Dynamic Page Content */}
        {/* Important: Removed bg-off-white here so it inherits the parent dark:bg-olive properly */}
        <main className="flex-1 transition-colors">
          {children}
        </main>
      </div>
    </div>
  );
}