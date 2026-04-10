'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, LogIn, Heart, LayoutDashboard, LogOut, Settings, Shield, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/icons';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { logOut } from '@/lib/firebase/auth';
import NotificationBell from '@/components/ui/NotificationBell';

interface NavLink {
  id: string;
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { id: 'nav-home', label: 'Home', href: '/' },
  { id: 'nav-hunts', label: 'Explore Hunts', href: '/hunts' },
  { id: 'nav-outfitters', label: 'Outfitters', href: '/outfitters' },
];

export function Header() {
  const { user, loading } = useUser();
  const { toast } = useToast();
  const pathname = usePathname();

  const isDashboard = pathname?.includes('/dashboard');

  const handleSignOut = async () => {
    try {
      await logOut();
      toast({ title: "Logged out successfully." });
    } catch (error) {
      toast({ variant: 'destructive', title: "Logout failed.", description: "Please try again." });
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center">
        
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo />
          </Link>
          
          {!isDashboard && (
            <nav className="flex items-center gap-6 text-sm">
              {navLinks.map((link) => (
                <Link key={link.id} href={link.href} className="transition-colors hover:text-foreground/80 text-foreground/60">
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <div className="mt-4">
                <Link href="/" className="mb-4 flex items-center">
                  <Logo />
                </Link>
                {!isDashboard && (
                  <div className="flex flex-col gap-4 py-4">
                    {navLinks.map((link) => (
                      <Link key={link.id} href={link.href} className="text-foreground">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-stone-200 dark:bg-stone-800 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-kalahari/10 text-kalahari font-bold hover:bg-kalahari/20">
                    {getInitials(user.displayName)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {user.role === 'HUNTER' && (
                      <DropdownMenuItem asChild>
                          <Link href="/hunter/dashboard" className='w-full flex items-center gap-2'><Heart className="h-4 w-4" /> My Wishlist</Link>
                      </DropdownMenuItem>
                  )}
                  {user.role === 'OUTFITTER' && (
                      <>
                        <DropdownMenuItem asChild>
                            <Link href="/outfitter/dashboard" className='w-full flex items-center gap-2'><LayoutDashboard className="h-4 w-4" /> Outfitter Hub</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/outfitter/dashboard/billing" className='w-full flex items-center gap-2 text-olive dark:text-off-white'>
                              <CreditCard className="h-4 w-4 text-kalahari" /> Billing & Account
                            </Link>
                        </DropdownMenuItem>
                      </>
                  )}
                  {user.role === 'ADMIN' && (
                      <DropdownMenuItem asChild>
                          <Link href="/admin" className='w-full flex items-center gap-2'><Shield className="h-4 w-4" /> Admin Panel</Link>
                      </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" asChild>
                 <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/login">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}