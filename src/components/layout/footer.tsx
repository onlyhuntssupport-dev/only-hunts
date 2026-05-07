import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t bg-background relative z-50">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} OnlyHunts (Pty) Ltd. All rights reserved.
          </p>
          
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
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

            {/* --- SOCIAL LINKS --- */}
            <div className="flex items-center gap-4 border-t border-muted pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              
              {/* X (Twitter) */}
              <a 
                href="https://x.com/Only_Hunts" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Follow us on X"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.961h-1.91z" />
                </svg>
              </a>

              {/* Instagram */}
              <a 
                href="https://instagram.com/OnlyHunts_App" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Follow us on Instagram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>

              {/* TikTok */}
              <a 
                href="https://tiktok.com/@OnlyHunts_App" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Follow us on TikTok"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.23-.9 4.45-2.43 6.08-1.65 1.71-4 2.75-6.39 2.68-2.61-.09-5.11-1.33-6.68-3.41-1.53-2.07-2.12-4.75-1.57-7.23.51-2.28 1.9-4.3 3.86-5.46 2.01-1.16 4.41-1.44 6.6-.84v4.06c-1.39-.42-2.95-.29-4.22.42-.9.51-1.59 1.34-1.89 2.33-.29 1.05-.22 2.21.29 3.16.51.93 1.38 1.58 2.42 1.84 1.15.28 2.4-.04 3.3-.81.82-.7 1.3-1.74 1.38-2.83.05-3.86.03-7.73.04-11.59V.02z" />
                </svg>
              </a>

            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}