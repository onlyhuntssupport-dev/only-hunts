
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Target } from 'lucide-react';
import { Hunt } from '@/lib/validations/hunt';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

// This is a simplification for the prototype. In a real app,
// this would come from an API or a central config file.
const USD_TO_ZAR_RATE = 18.5;

interface HuntProps {
  hunt: Hunt;
  currency: 'USD' | 'ZAR';
}

export function HuntCard({ hunt, currency }: HuntProps) {
  let displayPrice = hunt.basePrice;
  let displayCurrency = hunt.baseCurrency;

  // Convert price if the requested currency is different from the base currency
  if (currency !== hunt.baseCurrency) {
    if (hunt.baseCurrency === 'USD' && currency === 'ZAR') {
      displayPrice = hunt.basePrice * USD_TO_ZAR_RATE;
      displayCurrency = 'ZAR';
    } else if (hunt.baseCurrency === 'ZAR' && currency === 'USD') {
      displayPrice = hunt.basePrice / USD_TO_ZAR_RATE;
      displayCurrency = 'USD';
    }
    // Note: No conversion for EUR is implemented in this example.
  }

  const price = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: displayCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(displayPrice);

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg h-full">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Link href={`/hunts/${hunt.id}`}>
            <Image
              src={hunt.imageUrl}
              alt={hunt.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
              data-ai-hint={hunt.imageHint}
            />
        </Link>
        {hunt.isVerified && (
          <Badge variant="default" className="absolute top-3 left-3 gap-1.5">
            <ShieldCheck size={12} />
            Verified
          </Badge>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <p className="text-sm text-muted-foreground">{hunt.outfitterName}</p>
        <h3 className="text-lg font-bold font-headline text-primary mt-1 flex-grow">
          <Link href={`/hunts/${hunt.id}`}>{hunt.title}</Link>
        </h3>
        
        <div className="mt-3 flex flex-wrap gap-1">
          {hunt.species.slice(0, 3).map((s) => (
            <Badge key={s} variant="secondary" className='font-normal'>
              {s}
            </Badge>
          ))}
          {hunt.species.length > 3 && (
            <Badge variant="secondary" className='font-normal'>
              +{hunt.species.length - 3} more
            </Badge>
          )}
        </div>

        <div className="mt-4 pt-4 flex items-center justify-between border-t">
          <div>
            <p className="text-xs text-muted-foreground">From</p>
            <span className="text-xl font-bold text-primary">{price}</span>
          </div>
           <Button asChild size="sm">
            <Link href={`/hunts/${hunt.id}`}>View Details</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
