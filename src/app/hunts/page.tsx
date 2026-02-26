import { Suspense } from 'react';
import FilterSidebar from '@/components/marketplace/FilterSidebar';
import { HuntCard } from '@/components/marketplace/HuntCard';
import { getHunts } from '@/lib/firebase/queries';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PageProps {
  searchParams: { 
    province?: string; 
    species?: string; 
    currency?: 'USD' | 'ZAR';
  };
}

function HuntGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-96 bg-muted rounded-lg" />
      ))}
    </div>
  );
}

async function HuntList({ searchParams }: { searchParams: PageProps['searchParams'] }) {
  const provinces = searchParams.province?.split(',') || [];
  const species = searchParams.species?.split(',') || [];
  const currency = searchParams.currency || 'USD';

  const hunts = await getHunts({ provinces, species });

  if (hunts.length === 0) {
    return (
      <div className="text-center py-20 bg-card border border-dashed rounded-lg">
        <h3 className="text-xl font-headline font-bold">No matches found</h3>
        <p className="text-muted-foreground mt-2">Try adjusting your filters or checking back later.</p>
        <Button variant="outline" asChild className="mt-4">
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
    <div className="container mx-auto max-w-7xl py-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold">Explore Hunts</h1>
        <p className="text-muted-foreground mt-2">Discover premium hunting packages across South Africa.</p>
      </header>
      
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* FIX: FilterSidebar is now wrapped in a Suspense boundary */}
        <Suspense fallback={<div className="w-64 h-96 bg-muted animate-pulse rounded-lg" />}>
          <FilterSidebar />
        </Suspense>
        
        <main className="flex-1">
          <Suspense fallback={<HuntGridSkeleton />}>
            <HuntList searchParams={searchParams} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}