import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { Hunt } from '@/lib/validations/hunt';

interface HuntProps {
  hunt: Hunt;
}

export function HuntCard({ hunt }: HuntProps) {
  const price = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: hunt.baseCurrency,
  }).format(hunt.basePrice);

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
          data-ai-hint={hunt.imageUrl}
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
