import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} OnlyHunts (Pty) Ltd. All rights reserved.
          </p>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/legal/terms" className="text-muted-foreground transition-colors hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/legal/privacy" className="text-muted-foreground transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/legal/paia" className="text-muted-foreground transition-colors hover:text-foreground">
              PAIA Manual
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
