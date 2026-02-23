import FilterSidebar from '@/components/marketplace/FilterSidebar';
import { HuntCard } from '@/components/marketplace/HuntCard';
import { getHunts } from '@/lib/firebase/queries';

interface PageProps {
  searchParams: { 
    province?: string;
    species?: string;
  };
}

export default async function HuntsPage({ searchParams }: PageProps) {
  const provinceFilters = searchParams.province?.split(',') || [];
  const speciesFilters = searchParams.species?.split(',') || [];

  const hunts = await getHunts({ provinces: provinceFilters, species: speciesFilters });

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold">Explore South African Hunts</h1>
        <p className="text-muted-foreground mt-2">
          Use the filters to find your perfect hunting adventure.
        </p>
      </header>
      
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <FilterSidebar />
        
        <main className="flex-1">
          {hunts.length === 0 ? (
            <div className="text-center py-12 bg-card border rounded-lg">
              <h3 className="text-xl font-headline font-bold">No hunts found.</h3>
              <p className="text-muted-foreground mt-2">Try adjusting your filters.</p>
            </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {hunts.map((hunt) => (
                <HuntCard key={hunt.id} hunt={hunt} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
