
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { adminDb } from '@/lib/firebase/admin';
import { ShieldCheck, MapPin, Target } from 'lucide-react';
import { HuntSchema } from '@/lib/validations/hunt';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';
import WishlistButton from '@/components/marketplace/WishlistButton';
import AnalyticsTracker from '@/components/marketplace/AnalyticsTracker';
import LeadForm from '@/components/marketplace/LeadForm';
import { getHuntById } from '@/app/actions/hunts';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params;
  const { hunt } = await getHuntById(id);
  
  if (!hunt) {
    return { title: 'Hunt Not Found' };
  }
  
  const description = hunt.description 
    ? hunt.description.substring(0, 160) + '...'
    : `Book this premium hunting package in ${hunt.province || 'South Africa'} with ${hunt.outfitterName || 'a premier outfitter'}.`;

  return {
    title: `${hunt.title || 'Untitled Hunt'} | ${hunt.outfitterName || 'OnlyHunts'}`,
    description: description,
    openGraph: {
      title: hunt.title || 'Untitled Hunt',
      description: `Premium hunting in ${hunt.province || 'South Africa'}`,
      images: hunt.imageUrl ? [hunt.imageUrl] : [],
    },
  };
}

export default async function HuntDetailPage({ params }: Props) {
  const { id } = params;
  const { hunt: huntData, success } = await getHuntById(id);
  
  if (!success || !huntData) {
    notFound();
  }
  
  const hunt = HuntSchema.parse(huntData);

  const sessionCookie = cookies().get('__session')?.value;
  let user = null;
  let isSaved = false;
  if (sessionCookie) {
    try {
        user = await adminAuth.verifyIdToken(sessionCookie);
        if (user) {
            const wishlistRef = adminDb.collection('wishlists').doc(user.uid);
            const wishlistDoc = await wishlistRef.get();
            if (wishlistDoc.exists) {
                isSaved = wishlistDoc.data()?.huntIds?.includes(hunt.id);
            }
        }
    } catch (error) {
        // user is not logged in or session is invalid, do nothing
    }
  }

  return (
    <>
      <AnalyticsTracker huntId={hunt.id} />
      <div className="container mx-auto max-w-5xl py-12">
        <div className="relative w-full h-[50vh] md:h-[60vh] rounded-lg overflow-hidden mb-8">
          <Image 
            src={hunt.imageUrl} 
            alt={hunt.title} 
            fill 
            className="object-cover"
            priority
            data-ai-hint={hunt.imageHint}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-4xl font-bold font-headline text-primary mb-2">{hunt.title}</h1>
                {user && <WishlistButton huntId={hunt.id} hunterId={user.uid} isInitiallySaved={isSaved} />}
              </div>
              <div className="flex items-center flex-wrap gap-4 text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin size={16} /> {hunt.province}</span>
                {hunt.isVerified && (
                  <Badge variant="default" className="gap-1.5">
                    <ShieldCheck size={14} /> Verified Outfitter
                  </Badge>
                )}
              </div>
            </div>

            {hunt.description && (
                <section>
                    <h2 className="text-2xl font-bold font-headline text-primary mb-4">About This Adventure</h2>
                    <p className="text-muted-foreground whitespace-pre-line">{hunt.description}</p>
                </section>
            )}

            <section>
              <h2 className="text-2xl font-bold font-headline text-primary mb-4">Included Species</h2>
              <div className="flex flex-wrap gap-2">
                {hunt.species?.map((s: string) => (
                  <Badge key={s} variant="secondary" className="text-base font-medium py-1 px-3">
                    <Target size={16} className="mr-2 text-primary" /> {s}
                  </Badge>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                  <div>
                      <p className="text-sm text-muted-foreground mb-1">Starting from</p>
                      <p className="text-3xl font-bold text-primary">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: hunt.baseCurrency,
                        }).format(hunt.basePrice)}
                      </p>
                  </div>
              
                  <p className="text-sm font-medium">
                    Offered by: <Link href={`/outfitters/${hunt.outfitterId}`} className="font-bold text-primary hover:underline">{hunt.outfitterName}</Link>
                  </p>
                  
                  <LeadForm
                    huntId={hunt.id}
                    outfitterId={hunt.outfitterId}
                    huntTitle={hunt.title}
                  />

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
