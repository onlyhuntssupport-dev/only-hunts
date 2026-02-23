import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { Hunt } from '@/lib/validations/hunt';

// This is a simplification for the prototype. In a real app,
// this would come from an API.
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
    // If base is EUR, it will just display in EUR.
  }

  const price = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: displayCurrency,
  }).format(displayPrice);

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg h-full">
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <Image
          src={hunt.imageUrl}
          alt={hunt.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
          data-ai-hint={hunt.imageHint}
        />
        {hunt.isVerified && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
            <ShieldCheck size={12} />
            Verified
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold font-headline text-primary">{hunt.title}</h3>
        <p className="text-sm text-muted-foreground">{hunt.outfitterName}</p>
        
        <div className="mt-3 flex flex-wrap gap-2">
          {hunt.species.map((s) => (
            <span key={s} className="rounded bg-secondary/20 px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between border-t mt-4">
          <span className="text-xl font-bold text-primary">{price}</span>
           <Link href={`/hunts/${hunt.id}`} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
