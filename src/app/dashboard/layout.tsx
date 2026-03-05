import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { serverLogOut } from '@/app/actions/auth';
import { LayoutDashboard, Package, Users } from 'lucide-react';
import { Logo } from '@/components/icons';

const navLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '#', label: 'Manage Hunts', icon: Package },
  { href: '#', label: 'Outfitters', icon: Users },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sessionCookie = cookies().get('session')?.value;

  if (!sessionCookie) {
    return redirect('/login?redirect=/dashboard');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    
    // Check for both possible admin claims for robustness
    if (decodedToken.admin !== true && decodedToken.role !== 'ADMIN') {
      return redirect('/unauthorized');
    }

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r bg-muted/40 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                <Logo />
                <span className="font-bold">Admin Portal</span>
              </Link>
            </div>
            <div className="flex-1 mt-4">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
                {navLinks.map(link => (
                  <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                  >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="mt-auto p-4">
              <form action={serverLogOut}>
                  <Button type="submit" variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                      Sign Out
                  </Button>
              </form>
            </div>
          </div>
        </aside>
  
        <main className="flex flex-col">
          <header className="flex h-14 items-center justify-end gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <div className="text-sm font-medium text-muted-foreground">Master Admin</div>
          </header>
  
          <div className="flex-1 p-4 sm:p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    );

  } catch (error) {
    console.error("Dashboard layout auth error:", error);
    return redirect('/login?redirect=/dashboard');
  }
}
