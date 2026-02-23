import Image from 'next/image';
import { notFound } from 'next/navigation';
import { outfitters, hunts, reviews as allReviews } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HuntCard } from '@/components/hunt-card';
import { ReviewStars } from '@/components/review-stars';
import { CheckCircle, MessageSquare, Star } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function OutfitterPage({ params }: { params: { id: string } }) {
  const outfitter = outfitters.find(o => o.id === params.id);
  
  if (!outfitter) {
    notFound();
  }

  const outfitterHunts = hunts.filter(h => h.outfitterId === outfitter.id);
  const outfitterReviews = allReviews.filter(r => r.outfitterId === outfitter.id);

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">{outfitter.name}</h1>
        <div className="flex items-center gap-4 mt-2 text-muted-foreground">
          <span>{outfitter.location}</span>
          <span className="text-sm flex items-center gap-1">
            <Star className="w-4 h-4 text-secondary fill-current" />
            {outfitter.rating} ({outfitter.reviewsCount} reviews)
          </span>
        </div>
      </header>

      <Carousel className="w-full mb-8" opts={{ loop: true }}>
        <CarouselContent>
          {outfitter.images.map((image, index) => (
            <CarouselItem key={index}>
              <div className="relative h-[300px] md:h-[500px] w-full rounded-lg overflow-hidden">
                <Image src={image.imageUrl} alt={`${outfitter.name} - ${index + 1}`} fill className="object-cover" data-ai-hint={image.imageHint} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="ml-16" />
        <CarouselNext className="mr-16" />
      </Carousel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">About {outfitter.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">{outfitter.description}</p>
                </CardContent>
            </Card>

            <div className="mt-8">
                <h2 className="font-headline text-3xl font-bold mb-4">Hunt Packages</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {outfitterHunts.map(hunt => <HuntCard key={hunt.id} hunt={hunt} />)}
                </div>
            </div>

            <div className="mt-8">
                <h2 className="font-headline text-3xl font-bold mb-4">Reviews</h2>
                <Card>
                    <CardContent className="pt-6 space-y-6 divide-y">
                        {outfitterReviews.map(review => (
                            <div key={review.id} className="pt-6 first:pt-0">
                                <div className="flex items-start gap-4">
                                    <Avatar>
                                        <AvatarImage src={`https://i.pravatar.cc/150?u=${review.hunterName}`} />
                                        <AvatarFallback>{review.hunterName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className='w-full'>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold">{review.hunterName} - {review.hunterCountry}</p>
                                                <p className="text-sm text-muted-foreground">{review.date}</p>
                                            </div>
                                            <ReviewStars rating={review.rating} />
                                        </div>
                                        <p className="mt-2 text-muted-foreground">{review.comment}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>

        <aside className="lg:col-span-1 space-y-6">
            <Card className="sticky top-24">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Outfitter Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <h3 className="font-semibold">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                        {outfitter.amenities.map(amenity => (
                            <Badge key={amenity} variant="outline" className="flex items-center gap-1.5">
                                <CheckCircle className="h-3 w-3 text-green-600"/>
                                {amenity}
                            </Badge>
                        ))}
                    </div>
                    <Button className="w-full mt-4" size="lg">
                        <MessageSquare className="mr-2 h-4 w-4" /> Send Inquiry
                    </Button>
                </CardContent>
            </Card>
        </aside>
      </div>
    </div>
  );
}
