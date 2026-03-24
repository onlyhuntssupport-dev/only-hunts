import { Suspense } from 'react';
import FilterSidebar from '@/components/marketplace/FilterSidebar';
import HuntCard from '@/components/marketplace/HuntCard'; // FIX 1: Removed the curly brackets here!
import { getHunts } from '@/lib/firebase/queries';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// FIX 2: Updated interface for Next.js 15 where searchParams is a Promise
interface PageProps {
  searchParams: Promise<{ 
    province?: string; 
    species?: string; 
    currency?: 'USD' | 'ZAR';
  }>;
}

function HuntGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-96 bg-muted rounded-lg border-2 border-kalahari/10" />
      ))}
    </div>
  );
}

// FIX 3: Awaiting the searchParams Promise inside the data-fetching component
async function HuntList({ searchParamsPromise }: { searchParamsPromise: PageProps['searchParams'] }) {
  const resolvedParams = await searchParamsPromise;
  
  const provinces = resolvedParams.province?.split(',') || [];
  const species = resolvedParams.species?.split(',') || [];
  const currency = resolvedParams.currency || 'USD';

  const hunts = await getHunts({ provinces, species });

  if (hunts.length === 0) {
    return (
      <div className="text-center py-20 bg-card border-2 border-dashed border-kalahari/30 rounded-xl shadow-sm">
        <h3 className="text-2xl font-headline font-bold text-olive dark:text-off-white">No matches found</h3>
        <p className="text-olive/70 dark:text-off-white/70 mt-2 font-medium">Try adjusting your filters or checking back later.</p>
        <Button asChild className="mt-6 bg-kalahari hover:bg-kalahari/90 text-olive dark:text-off-white font-bold">
            <Link href="/hunts">Clear Filters</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {hunts.map((hunt) => (
        <HuntCard key={hunt.id} hunt={hunt} currency={currency} />
      ))}
    </div>
  );
}

export default function HuntsPage({ searchParams }: PageProps) {
  return (
    <div className="container mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8">
      <header className="mb-10 border-b-2 border-kalahari/20 pb-6">
        <h1 className="font-headline text-4xl font-black text-olive dark:text-off-white tracking-tight">Explore Hunts</h1>
        <p className="text-olive/70 dark:text-off-white/60 mt-2 font-medium text-lg">Discover premium hunting packages across South Africa.</p>
      </header>
      
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* FilterSidebar wrapped in a Suspense boundary */}
        <Suspense fallback={<div className="w-full md:w-64 h-96 bg-muted animate-pulse rounded-xl border-2 border-kalahari/10" />}>
          <FilterSidebar />
        </Suspense>
        
        <main className="flex-1 w-full">
          <Suspense fallback={<HuntGridSkeleton />}>
            <HuntList searchParamsPromise={searchParams} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}