import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ShieldCheck, Users, LayoutDashboard } from 'lucide-react';
import { Logo } from '@/components/icons';

const navLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
  { href: '/admin/staff', label: 'Staff Management', icon: Users },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sessionCookie = cookies().get('__session')?.value;

  if (!sessionCookie) {
    // Redirect to login page if no session cookie
    return redirect('/login?redirect=/admin');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    
    if (decodedToken.role !== 'ADMIN') {
      // Redirect if the user is not an admin
      return redirect('/unauthorized');
    }

    // If authorized, render the admin layout
    return (
      <div className="flex min-h-screen bg-muted/40">
        <aside className="w-64 bg-background border-r p-6 hidden md:flex flex-col gap-8 sticky top-0 h-screen">
          <Link href="/admin">
            <Logo />
          </Link>
          <nav className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="px-2 text-xs uppercase text-muted-foreground font-semibold tracking-wider">Management</p>
              {navLinks.map(link => (
                <Link 
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </aside>
        <div className="flex flex-col flex-1">
            <main className="flex-1 p-6 md:p-10">
              {children}
            </main>
        </div>
      </div>
    );
  } catch (error) {
    // If token verification fails, redirect to login
    console.error("Admin layout auth error:", error);
    return redirect('/login?redirect=/admin');
  }
}
