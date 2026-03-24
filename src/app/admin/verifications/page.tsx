import { verifyOutfitter } from '@/app/actions/admins';
import { adminDb } from '@/lib/firebase/admin';
import { CheckCircle, FileText, ExternalLink } from 'lucide-react';
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

export default async function VerificationsPage() {
  const pendingSnapshot = await adminDb
    .collection('users')
    .where('role', '==', 'OUTFITTER')
    .where('isVerified', '==', false)
    .get();

  const pendingOutfitters = pendingSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as { displayName?: string; email?: string }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Outfitter Verifications</CardTitle>
        <CardDescription>
          Review and approve new outfitter applications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business Name</TableHead>
              <TableHead>Contact Email</TableHead>
              <TableHead>License Docs</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingOutfitters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No pending applications.
                </TableCell>
              </TableRow>
            ) : (
              pendingOutfitters.map((outfitter) => (
                <TableRow key={outfitter.id}>
                  <TableCell>
                    <div className="font-medium">
                      {outfitter.displayName || 'Unnamed Business'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      UID: {outfitter.id.slice(0, 8)}...
                    </div>
                  </TableCell>
                  <TableCell>{outfitter.email}</TableCell>
                  <TableCell>
                    <Button variant="link" className="px-0 h-auto font-bold">
                      <FileText className="mr-2" />
                      PH_LICENSE.pdf
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <form
                      action={async () => {
                        'use server';
                        await verifyOutfitter(outfitter.id);
                      }}
                    >
                      <Button size="sm" variant="outline">
                        <CheckCircle className="mr-2" />
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
