
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase/admin';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { getOutfitterHunts } from '@/app/actions/hunts';
import HuntsTable from '@/components/dashboard/HuntsTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const metadata = {
  title: 'My Hunts | Outfitter Dashboard',
};

export default async function HuntsPage() {
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) redirect('/login?redirect=/outfitter/dashboard/hunts');

  let uid: string;
  try {
    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    if (decodedToken.role !== 'OUTFITTER') redirect('/unauthorized');
    uid = decodedToken.uid;
  } catch (error) {
    redirect('/login?redirect=/outfitter/dashboard/hunts');
  }

  const { hunts, error } = await getOutfitterHunts(uid);

  if (error) {
    return (
        <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight">My Hunts</h1>
          <p className="text-muted-foreground mt-1">Manage your active listings and drafts.</p>
        </div>
        <Button asChild>
          <Link href="/outfitter/dashboard/create">
            <PlusCircle className="mr-2" />
            New Package
          </Link>
        </Button>
      </div>

      <HuntsTable initialHunts={hunts || []} />
    </div>
  );
}
