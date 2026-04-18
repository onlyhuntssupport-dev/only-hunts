"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { Shield, Store, Users, Activity, Wallet, Inbox, Loader2, BarChart, Award, Megaphone, Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/admin', label: 'Staff / Team', icon: Shield },
  { href: '/admin/outfitters', label: 'Outfitters', icon: Store },
  { href: '/admin/hunters', label: 'Hunters', icon: Users },
  { href: '/admin/pipeline', label: 'Quote Flow', icon: Activity },
  { href: '/admin/accounting', label: 'Accounting', icon: Wallet },
  { href: '/admin/endorsements', label: 'Endorsements', icon: Award },
  { href: '/admin/ads', label: 'Sponsored Ads', icon: Megaphone },
  { href: '/admin/support', label: 'Support Inbox', icon: Inbox, isSupport: true }, 
  { href: '/admin/traffic', label: 'Traffic Analytics', icon: BarChart }, 
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname(); 
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false); 
        router.replace('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
          const role = userDoc.data().role?.toUpperCase();
          if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'SUPERADMIN') {
            setIsAuthorized(true);
          } else {
            router.replace('/');
          }
        } else {
          router.replace('/');
        }
      } catch (error) {
        console.error("Admin layout auth error:", error);
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!isAuthorized) return;

    const q = query(
      collection(db, "supportTickets"), 
      where("status", "==", "OPEN")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOpenTicketsCount(snapshot.docs.length);
    }, (error) => {
      console.error("Failed to fetch ticket count:", error);
    });

    return () => unsubscribe();
  }, [isAuthorized]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white dark:bg-stone-950 flex items-center justify-center transition-colors">
        <Loader2 className="animate-spin h-12 w-12 text-kalahari" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="flex h-screen bg-off-white dark:bg-stone-950 overflow-hidden transition-colors">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 md:w-20 lg:w-64 border-r-2 border-kalahari/20 bg-white dark:bg-stone-900 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="p-6 border-b-2 border-kalahari/10 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 bg-kalahari rounded-xl flex items-center justify-center text-white font-black shrink-0">
              OH
            </div>
            <span className="block md:hidden lg:block font-black font-headline text-olive dark:text-off-white uppercase tracking-tighter">
              Admin v3.0
            </span>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-olive/50 hover:text-kalahari dark:text-white/40 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-black text-sm uppercase tracking-tighter transition-all ${
                  isActive 
                  ? 'bg-kalahari text-white shadow-lg' 
                  : 'text-olive/50 dark:text-white/40 hover:bg-kalahari/10'
                }`}
              >
                <div className="relative">
                  <link.icon className="h-5 w-5 shrink-0" />
                  {link.isSupport && openTicketsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 md:hidden lg:hidden">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  )}
                </div>
                
                <span className="flex md:hidden lg:flex items-center justify-between flex-1">
                  {link.label}
                  {link.isSupport && openTicketsCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-black animate-in zoom-in">
                      {openTicketsCount}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between p-4 border-b-2 border-kalahari/20 bg-white dark:bg-stone-900 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-kalahari rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0">
              OH
            </div>
            <span className="font-black font-headline text-olive dark:text-off-white uppercase tracking-tighter text-sm">
              Admin
            </span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="p-2 -mr-2 text-olive dark:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

    </div>
  );
}