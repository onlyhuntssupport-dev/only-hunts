
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { HuntCard } from '@/components/marketplace/HuntCard';
import type { Hunt } from '@/lib/validations/hunt';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function HunterDashboard() {
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) redirect('/login?redirect=/hunter/dashboard');
  
  let uid: string;
  try {
    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    uid = decodedToken.uid;
  } catch (error) {
    redirect('/login?redirect=/hunter/dashboard');
  }

  const wishlistDoc = await adminDb.collection('wishlists').doc(uid).get();
  const savedIds = wishlistDoc.data()?.huntIds || [];

  let savedHunts: Hunt[] = [];
  if (savedIds.length > 0) {
    const huntsSnapshot = await adminDb.collection('hunts')
      .where(adminDb.FieldPath.documentId(), 'in', savedIds.slice(0, 30))
      .get();
    savedHunts = huntsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Hunt[];
  }

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-4xl font-bold font-headline">My Dashboard</h1>
        <p className="text-muted-foreground mt-2">Plan your next adventure. Here are your saved hunts and inquiries.</p>
      </header>

      <section>
        <h2 className="text-2xl font-bold font-headline mb-6 flex items-center gap-3">
          <Heart className="text-primary" />
          My Wishlist
        </h2>
        {savedHunts.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <h3 className="text-xl font-semibold">Your wishlist is empty.</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              Start exploring and save the hunts that catch your eye.
            </p>
            <Button asChild>
                <Link href="/hunts">Explore Hunts</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedHunts.map(hunt => (
              <HuntCard key={hunt.id} hunt={hunt} currency="USD" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
