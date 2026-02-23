import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { HuntCard } from '@/components/marketplace/HuntCard';
import { ArrowRight, Search, MapPin, Target, UserCheck } from 'lucide-react';
import { hunts } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const heroImage = PlaceHolderImages.find(p => p.id === 'hero-savanna');

const howItWorksSteps = [
    {
        icon: Search,
        title: 'Discover Hunts',
        description: 'Use our powerful search to find the perfect hunt by species, location, and price.',
        image: PlaceHolderImages.find(p => p.id === 'how-it-works-1')!,
    },
    {
        icon: UserCheck,
        title: 'Connect with Outfitters',
        description: 'Communicate directly with verified South African outfitters to plan your trip.',
        image: PlaceHolderImages.find(p => p.id === 'how-it-works-2')!,
    },
    {
        icon: Target,
        title: 'Book Your Adventure',
        description: 'Secure your dream safari with confidence and get ready for an unforgettable experience.',
        image: PlaceHolderImages.find(p => p.id === 'how-it-works-3')!,
    }
]

export default function Home() {
  return (
    <>
      <section className="relative h-[60vh] min-h-[500px] w-full flex items-center justify-center text-primary-foreground">
        {heroImage && (
             <Image
                src={heroImage.imageUrl}
                alt="African Savanna"
                fill
                className="object-cover -z-10 brightness-50"
                priority
                data-ai-hint={heroImage.imageHint}
            />
        )}
        <div className="container text-center">
          <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight">Your African Adventure Awaits</h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto">
            Discover and book ethical hunting safaris with South Africa's most reputable outfitters.
          </p>
          <div className="mt-8 max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search by species (e.g., Kudu, Impala)" className="pl-10 h-12 text-base" />
            </div>
            <Button size="lg" className="w-full sm:w-auto h-12">
              <Link href="/hunts">Search</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">Featured Hunts</h2>
            <p className="mt-2 text-muted-foreground max-w-xl mx-auto">Handpicked adventures from our top-rated outfitters.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {hunts.slice(0, 4).map(hunt => (
              <HuntCard key={hunt.id} hunt={hunt} currency="USD" />
            ))}
          </div>
          <div className="text-center mt-12">
            <Button variant="outline" asChild>
              <Link href="/hunts">
                View All Hunts <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container">
           <div className="text-center mb-12">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">How It Works</h2>
            <p className="mt-2 text-muted-foreground max-w-xl mx-auto">Your journey to an unforgettable hunt in just three simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {howItWorksSteps.map((step, index) => (
                <Card key={index} className="border-0 shadow-lg">
                    <CardHeader>
                        <div className="relative aspect-video mb-4">
                            <Image src={step.image.imageUrl} alt={step.title} fill className="object-cover rounded-t-lg" data-ai-hint={step.image.imageHint} />
                        </div>
                        <div className="mx-auto bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center mb-4">
                            <step.icon className="h-6 w-6"/>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <h3 className="text-xl font-bold font-headline mb-2">{step.title}</h3>
                        <p className="text-muted-foreground">{step.description}</p>
                    </CardContent>
                </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="container">
            <div className="bg-secondary text-secondary-foreground rounded-lg p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="lg:w-1/2">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold">Are You an Outfitter?</h2>
                    <p className="mt-4 text-lg">
                        Join our platform to connect with a global audience of serious hunters. Showcase your packages, manage bookings, and grow your business.
                    </p>
                </div>
                <div className="lg:w-1/2 flex justify-center lg:justify-end">
                    <Button size="lg" variant="outline" className="bg-secondary hover:bg-secondary/90 border-secondary-foreground text-secondary-foreground">
                        Become a Partner
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
      </section>
    </>
  );
}
