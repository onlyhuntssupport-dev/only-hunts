import { hunts, outfitters } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Hunt } from '@/lib/validations/hunt';

export default function HuntPage({ params }: { params: { id: string } }) {
  const hunt = hunts.find(h => h.id === params.id) as unknown as Hunt | undefined;

  if (!hunt) {
    notFound();
  }

  const outfitter = outfitters.find(o => o.id === hunt.outfitterId);

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="relative h-96 w-full rounded-lg overflow-hidden mb-8">
        <Image
          src={hunt.imageUrl}
          alt={hunt.title}
          fill
          className="object-cover"
          priority
        />
      </div>
      
      <h1 className="font-headline text-4xl font-bold">{hunt.title}</h1>
      
      {outfitter && (
        <p className="text-muted-foreground mt-2 text-lg">
          An adventure by <Link href={`/outfitters/${outfitter.id}`} className="text-primary hover:underline">{outfitter.name}</Link>
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {hunt.species.map((s) => (
          <Badge key={s} variant="secondary">{s}</Badge>
        ))}
      </div>

      <div className="mt-8 border-t pt-8">
        <div className="prose prose-lg max-w-none text-muted-foreground">
            {/* <p>{hunt.description}</p> */}
            <ul>
                {/* <li><strong>Duration:</strong> {hunt.duration}</li> */}
                {/* <li><strong>Hunt Type:</strong> {hunt.type}</li> */}
            </ul>
        </div>
      </div>
    </div>
  );
}
