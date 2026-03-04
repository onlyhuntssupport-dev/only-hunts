import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HuntCard } from '@/components/marketplace/HuntCard';
import { getPublishedHunts } from '@/app/actions/hunts';

export const metadata = {
  title: 'OnlyHunts | Book Your Next Adventure',
  description: 'Connect with top outfitters and book premium hunting packages.',
};

// Revalidate this page every hour to fetch fresh data
export const revalidate = 3600; 

export default async function Home() {
  const { hunts } = await getPublishedHunts();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-muted/30 py-16 md:py-24 border-b">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight mb-6">
            Find Your Next Great Adventure
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            The premier marketplace connecting passionate hunters with world-class outfitters across the globe.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="px-8 font-medium text-md" asChild>
                <Link href="/outfitter/dashboard">Are you an Outfitter?</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feed Section */}
      <section className="flex-1 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-headline font-bold">Featured Packages</h2>
          </div>

          {!hunts || hunts.length === 0 ? (
            <div className="text-center py-24 bg-card border rounded-xl shadow-sm">
              <h3 className="text-xl font-headline font-bold mb-2">Check back soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Our outfitters are currently building out their incredible packages. New adventures will be listed here shortly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {hunts.map((hunt: any) => (
                <HuntCard key={hunt.id} hunt={hunt} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
