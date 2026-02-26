
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import FirebaseClientProvider from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'OnlyHunts - Premier South African Hunting Safaris',
  description: 'Discover and book exclusive hunting packages with top-rated South African outfitters.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side check to ensure Firebase environment variables are loaded.
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'placeholder') {
    return (
      <html lang="en">
        <body>
          <div style={{ fontFamily: 'sans-serif', padding: '2rem', backgroundColor: '#fff2f2', color: '#b91c1c', border: '2px solid #ef4444', borderRadius: '8px', margin: '2rem' }}>
            <h1>Configuration Error: Firebase API Key is Missing</h1>
            <p style={{ marginTop: '1rem' }}>The application cannot connect to Firebase because the client-side API key is not configured.</p>
            <p style={{ marginTop: '0.5rem' }}>This is caused by a missing or incorrect <strong>.env.local</strong> file.</p>
            <h3 style={{ marginTop: '1.5rem', borderTop: '1px solid #fca5a5', paddingTop: '1rem' }}>How to Fix:</h3>
            <ol style={{ listStyle: 'decimal', paddingLeft: '2rem', marginTop: '1rem', lineHeight: '1.6' }}>
              <li>In the root folder of your project, create a new file named <strong>.env.local</strong></li>
              <li>Copy and paste your Firebase Web App configuration into it. You can find these values in your Firebase Console under Project Settings {'>'} General {'>'} Your apps.</li>
            </ol>
            <pre style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '4px', marginTop: '1rem', overflowX: 'auto', color: '#1f2937' }}>
              <code>
                NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy...your...key"<br />
                NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"<br />
                NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"<br />
                NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"<br />
                NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"<br />
                NEXT_PUBLIC_FIREBASE_APP_ID="1:your-app-id:web:..."<br />
                NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-..."
              </code>
            </pre>
            <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>
              After creating or saving the .env.local file, you MUST restart your development server for the changes to apply.
            </p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased')}>
        <FirebaseClientProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
