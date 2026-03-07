import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase/admin';
import { AppSidebar } from '@/components/sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  // 1. If no cookie exists, send back to login
  if (!sessionCookie) {
    redirect('/login');
  }

  let decodedToken = null;

  try {
    // 2. FIX: Use verifySessionCookie instead of verifyIdToken
    // The second parameter 'true' checks if the session was revoked
    decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch (error) {
    console.error("Token verification failed:", error);
    // If verification fails (expired or invalid), clear cookie and redirect
    redirect('/login');
  }

  // 3. Security Check: Ensure only Admins can access the dashboard
  if (!decodedToken || decodedToken.role !== 'ADMIN') {
    // Optional: You could redirect to a "unauthorized" page instead
    redirect('/login');
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset>
          <main className="flex-1 p-6 lg:p-10">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}