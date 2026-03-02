import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { LayoutDashboard, Package, Users, Settings, LogOut, Menu } from 'lucide-react';
import { serverLogOut } from '@/app/actions/auth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const metadata = {
  title: 'Outfitter Dashboard',
  description: 'Manage your hunting packages and leads.',
};

const navLinks = [
    { href: "/outfitter/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/outfitter/dashboard/hunts", label: "My Hunts", icon: Package },
    { href: "/outfitter/dashboard/leads", label: "Inquiries", icon: Users },
    { href: "/outfitter/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode; }) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Logo />
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navLinks.map(link => (
                <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <form action={serverLogOut}>
                <Button type="submit" variant="ghost" className="w-full justify-start">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                </Button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 md:hidden"
                    >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                    <nav className="grid gap-2 text-lg font-medium">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-lg font-semibold mb-4"
                    >
                        <Logo />
                    </Link>
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                        >
                            <link.icon className="h-5 w-5" />
                            {link.label}
                        </Link>
                    ))}
                    </nav>
                    <div className="mt-auto">
                        <form action={serverLogOut}>
                            <Button type="submit" variant="ghost" className="w-full justify-start">
                                <LogOut className="mr-2 h-4 w-4" />
                                Log Out
                            </Button>
                        </form>
                    </div>
                </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
                {/* Possible future use: Breadcrumbs or search */}
            </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
