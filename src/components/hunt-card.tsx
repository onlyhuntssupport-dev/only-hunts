import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calendar, DollarSign, Tag } from 'lucide-react';
import type { hunts as HuntType } from '@/lib/data';

type HuntCardProps = {
  hunt: (typeof HuntType)[0];
};

export function HuntCard({ hunt }: HuntCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden h-full shadow-md hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={hunt.image.imageUrl}
            alt={hunt.title}
            fill
            className="object-cover"
            data-ai-hint={hunt.image.imageHint}
          />
        </div>
        <div className="p-4">
            <CardTitle className="font-headline text-xl mb-2">{hunt.title}</CardTitle>
            <div className="flex flex-wrap gap-2">
                {hunt.species.map((s) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                ))}
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0">
        <div className="text-muted-foreground space-y-2 text-sm">
            <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary"/>
                <span>${hunt.price}</span>
            </div>
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary"/>
                <span>{hunt.duration}</span>
            </div>
            <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary"/>
                <span>{hunt.type} Hunt</span>
            </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full">
          <Link href={`/hunts/${hunt.id}`}>
            View Hunt <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
