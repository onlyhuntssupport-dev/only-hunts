"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { Shield, Store, Users, Activity, Wallet, Inbox, Loader2, BarChart } from 'lucide-react';

const navLinks = [
  { href: '/admin', label: 'Staff / Team', icon: Shield },
  { href: '/admin/outfitters', label: 'Outfitters', icon: Store },
  { href: '/admin/hunters', label: 'Hunters', icon: Users },
  { href: '/admin/pipeline', label: 'Quote Flow', icon: Activity },
  { href: '/admin/accounting', label: 'Accounting', icon: Wallet },
  { href: '/admin/support', label: 'Support Inbox', icon: Inbox, isSupport: true }, 
  { href: '/admin/traffic', label: 'Traffic Analytics', icon: BarChart }, 
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname(); 
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [openTicketsCount, setOpenTicketsCount] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      // FIX: Ensure loading state is killed even if they are redirected
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
        // This only fires if the try/catch block actually runs
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
      
      <aside className="w-20 lg:w-64 border-r-2 border-kalahari/20 bg-white dark:bg-stone-900 hidden md:flex flex-col transition-all z-20">
        
        <Link href="/" className="p-6 border-b-2 border-kalahari/10 flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="h-10 w-10 bg-kalahari rounded-xl flex items-center justify-center text-white font-black shrink-0">
            OH
          </div>
          <span className="hidden lg:block font-black font-headline text-olive dark:text-off-white uppercase tracking-tighter">
            Admin v3.0
          </span>
        </Link>
        
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
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 lg:hidden">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  )}
                </div>
                
                <span className="hidden lg:flex items-center justify-between flex-1">
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

      <main className="flex-1 flex flex-col relative overflow-y-auto">
        {children}
      </main>

    </div>
  );
}