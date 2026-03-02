
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HuntCardProps {
  hunt: {
    id: string;
    title: string;
    description: string;
    basePrice: number;
    province: string;
    species: string[];
    imageUrl?: string;
  };
}

export function HuntCard({ hunt }: HuntCardProps) {
  // Take the first 3 species for display
  const speciesList = hunt.species.slice(0, 3);

  return (
    <div className="group flex flex-col bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full">
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img 
          src={hunt.imageUrl || 'https://images.unsplash.com/photo-1588612143003-88da87c71d64?q=80&w=800&auto=format&fit=crop'} 
          alt={hunt.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-foreground">
          ${hunt.basePrice.toLocaleString()}
        </div>
      </div>

      {/* Content Container */}
      <div className="flex flex-col flex-1 p-5">
        <div className="text-xs font-medium text-primary mb-2 uppercase tracking-wider">
          {hunt.province}
        </div>
        
        <h3 className="font-headline font-bold text-lg mb-2 line-clamp-2 flex-grow">
          {hunt.title}
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {speciesList.map((species, i) => (
            <Badge key={i} variant="secondary" className="font-normal">
              {species}
            </Badge>
          ))}
          {hunt.species.length > 3 && (
            <Badge variant="secondary" className="font-normal">
              +{hunt.species.length - 3} more
            </Badge>
          )}
        </div>

        <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors mt-auto">
          <Link href={`/hunts/${hunt.id}`} className="w-full">
            View Details
          </Link>
        </Button>
      </div>
    </div>
  );
}
