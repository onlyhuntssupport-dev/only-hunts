import Link from 'next/link';
import Image from 'next/image';
import { outfitters } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

export default function OutfittersPage() {
  return (
    <div className="container mx-auto max-w-7xl py-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold">Our Outfitters</h1>
        <p className="text-muted-foreground mt-2">
          Meet our trusted partners across South Africa.
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {outfitters.map(outfitter => (
          <Link href={`/outfitters/${outfitter.id}`} key={outfitter.id} className="group">
            <Card className="h-full overflow-hidden transition-shadow duration-300 group-hover:shadow-xl">
              <CardHeader className="p-0">
                <div className="relative h-56 w-full">
                  <Image
                    src={outfitter.images[0].imageUrl}
                    alt={outfitter.name}
                    fill
                    className="object-cover"
                    data-ai-hint={outfitter.images[0].imageHint}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="font-headline text-xl mb-2">{outfitter.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{outfitter.location}</p>
                <div className="flex items-center gap-1 mt-2">
                    <Star className="w-4 h-4 text-secondary fill-current" />
                    <span className="text-sm font-bold">{outfitter.rating}</span>
                    <span className="text-sm text-muted-foreground">({outfitter.reviewsCount} reviews)</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
