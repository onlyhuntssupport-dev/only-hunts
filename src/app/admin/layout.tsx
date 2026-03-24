"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { ShieldCheck, Users, LayoutDashboard, ClipboardCheck, Loader2 } from 'lucide-react';

const navLinks = [
  { href: '/admin', label: 'Internal Team', icon: Users },
  { href: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
  { href: '/admin/approvals', label: 'Hunt Approvals', icon: ClipboardCheck },
  // Add more links here as you build out the admin dashboard
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        // Not logged in at all -> Kick to login
        router.replace('/login');
        return;
      }

      try {
        // Fetch role from Firestore (The Source of Truth)
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
          const role = userDoc.data().role?.toUpperCase();
          if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'SUPERADMIN') {
            setIsAuthorized(true);
          } else {
            // Logged in, but NOT an admin -> Kick to home
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

  // Prevent flash of unauthorized content while checking
  if (loading) {
    return (
      <div className="min-h-screen bg-off-white dark:bg-olive flex items-center justify-center transition-colors duration-300">
        <Loader2 className="animate-spin h-12 w-12 text-kalahari" />
      </div>
    );
  }

  // Double security: render nothing if not authorized
  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-off-white dark:bg-olive transition-colors duration-300">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="w-64 bg-white dark:bg-black/20 border-r-2 border-kalahari/20 dark:border-kalahari/30 p-6 hidden md:flex flex-col gap-8 sticky top-0 h-screen transition-colors shadow-sm">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-kalahari text-olive font-bold font-headline h-8 w-8 flex items-center justify-center rounded shadow-sm text-lg">
            OH
          </div>
          <span className="text-olive dark:text-off-white font-headline font-bold text-xl tracking-wide transition-colors">
            Only-Hunts
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-col gap-4 flex-1">
          <div className="flex flex-col gap-2">
            <p className="px-3 text-[10px] uppercase text-olive/50 dark:text-off-white/40 font-black tracking-widest mb-1 transition-colors">
              Management
            </p>
            {navLinks.map(link => (
              <Link 
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-lg text-olive/70 dark:text-off-white/60 hover:bg-kalahari/10 dark:hover:bg-kalahari/20 hover:text-olive dark:hover:text-kalahari transition-all"
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </nav>
        
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 transition-colors">
          {children}
        </main>
      </div>

    </div>
  );
}