
import { approveHuntListing } from '@/app/actions/admin';
import { adminDb } from '@/lib/firebase/admin';
import { CheckCircle, ExternalLink } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Hunt } from '@/lib/validations/hunt';
import Link from 'next/link';

export default async function ApprovalsPage() {
  const pendingSnapshot = await adminDb
    .collection('hunts')
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .get();

  const pendingHunts = pendingSnapshot.docs.map((doc) => {
    const data = doc.data();
    // Manually construct the object to ensure type consistency
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(), // Convert Firestore Timestamp to JS Date
    } as Hunt & { id: string };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hunt Listing Approvals</CardTitle>
        <CardDescription>
          Review and approve new hunt packages. Approved hunts will become visible on the marketplace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hunt Details</TableHead>
              <TableHead>Outfitter</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingHunts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No pending hunt approvals.
                </TableCell>
              </TableRow>
            ) : (
              pendingHunts.map((hunt) => (
                <TableRow key={hunt.id}>
                  <TableCell>
                    <div className="font-medium">{hunt.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {hunt.province} &bull; {new Intl.NumberFormat('en-US', { style: 'currency', currency: hunt.baseCurrency }).format(hunt.basePrice)}
                    </div>
                  </TableCell>
                  <TableCell>{hunt.outfitterName}</TableCell>
                   <TableCell>
                    {new Date(hunt.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/hunts/${hunt.id}`} target="_blank" title="View Listing Page">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <form
                      action={async () => {
                        'use server';
                        await approveHuntListing(hunt.id);
                      }}
                      className="inline-block"
                    >
                      <Button size="sm">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
