import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase/admin';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  // 1. Check if session exists
  if (!sessionCookie) {
    redirect('/login');
  }

  try {
    // 2. Verify the 7-day session cookie
    await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch (error) {
    console.error("Token verification failed:", error);
    redirect('/login');
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      {/* Super Admin Navigation Bar */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-8 border-b bg-card px-6 shadow-sm">
        <div className="font-bold text-lg tracking-tight text-primary">Admin Portal</div>
        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Overview
          </Link>
          <Link href="/dashboard/outfitters" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Manage Outfitters
          </Link>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 w-full">
        {children}
      </main>
    </div>
  );
}