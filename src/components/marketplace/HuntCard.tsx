import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

interface HuntProps {
  hunt: {
    id: string;
    title: string;
    outfitterName: string;
    priceUSD: number;
    priceZAR: number;
    species: string[];
    imageUrl: string;
    imageHint: string;
    isVerified: boolean;
  };
  currency: 'USD' | 'ZAR';
}

export function HuntCard({ hunt, currency }: HuntProps) {
  const price = currency === 'USD' ? `$${hunt.priceUSD.toLocaleString()}` : `R${hunt.priceZAR.toLocaleString()}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-off-white shadow-sm transition-shadow duration-300 hover:shadow-md h-full">
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
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-olive px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            <ShieldCheck size={12} />
            Verified
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-olive">{hunt.title}</h3>
        <p className="text-sm text-slate-500">{hunt.outfitterName}</p>
        
        <div className="mt-3 flex flex-wrap gap-2">
          {hunt.species.map((s) => (
            <span key={s} className="rounded bg-kalahari/20 px-2 py-0.5 text-xs font-medium text-olive">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100 mt-4">
          <span className="text-xl font-bold text-olive">{price}</span>
           <Link href={`/hunts/${hunt.id}`} className="rounded-md bg-olive px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-opacity-90">
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
