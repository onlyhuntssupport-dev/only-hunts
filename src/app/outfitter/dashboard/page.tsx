
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Edit, PlusCircle, Mail } from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Badge } from '@/components/ui/badge';
import type { Hunt } from '@/lib/validations/hunt';
import type { Inquiry } from '@/lib/validations/inquiry';

export default async function OutfitterDashboard() {
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) redirect('/login?redirect=/outfitter/dashboard');

  let uid: string;
  try {
    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    if (decodedToken.role !== 'OUTFITTER') redirect('/unauthorized');
    uid = decodedToken.uid;
  } catch (error) {
    redirect('/login?redirect=/outfitter/dashboard');
  }

  const inventorySnapshot = await adminDb
    .collection('hunts')
    .where('outfitterId', '==', uid)
    .orderBy('createdAt', 'desc')
    .get();

  const inquiriesSnapshot = await adminDb
    .collection('inquiries')
    .where('outfitterId', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();
  
  const newInquiriesSnapshot = await adminDb
    .collection('inquiries')
    .where('outfitterId', '==', uid)
    .where('status', '==', 'new')
    .get();

  const inventory = inventorySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Hunt[];

  const recentInquiries = inquiriesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Inquiry[];

  const newInquiriesCount = newInquiriesSnapshot.size;

  return (
    <div className="space-y-6 p-4 md:p-8 pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Hunt Packages</CardTitle>
              <CardDescription>Manage your active listings and pricing.</CardDescription>
            </div>
            <Button asChild>
              <Link href="/outfitter/dashboard/create">
                <PlusCircle /> Create New Hunt
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package Details</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      You haven't listed any hunts yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.map((hunt) => (
                    <TableRow key={hunt.id}>
                      <TableCell>
                        <div className="font-medium">{hunt.title}</div>
                        <div className="text-sm text-muted-foreground">{hunt.species?.join(', ')}</div>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: hunt.baseCurrency,
                        }).format(hunt.basePrice)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={hunt.isVerified ? 'default' : 'secondary'}>
                          {hunt.isVerified ? 'Verified' : 'Pending Review'}
                        </Badge>
                      </TableCell>
                      <td className="px-6 py-4 text-right space-x-2">
                          <Button variant="ghost" size="icon" title="Edit Package">
                              <Edit />
                          </Button>
                      </td>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1 space-y-6">
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center justify-between">
                <span>Recent Leads</span>
                {newInquiriesCount > 0 && <Badge>{newInquiriesCount} New</Badge>}
            </CardTitle>
            <CardDescription>Latest inquiries from potential clients.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-4">
              {recentInquiries.length === 0 ? (
                <p className="text-sm text-muted-foreground p-6 text-center">No inquiries yet.</p>
              ) : recentInquiries.map((inquiry, index) => (
                <div key={inquiry.id} className={`p-4 flex items-center justify-between ${index < recentInquiries.length - 1 ? 'border-b' : ''}`}>
                  <div>
                    <p className="font-medium text-sm">{inquiry.hunterName}</p>
                    <p className="text-xs text-muted-foreground">{inquiry.huntTitle}</p>
                  </div>
                  <Badge variant={inquiry.status === 'new' ? 'default' : 'outline'}>{inquiry.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-6">
            <Button asChild className="w-full">
              <Link href="/outfitter/dashboard/leads">
                <Mail className="mr-2" /> View All Inquiries
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
