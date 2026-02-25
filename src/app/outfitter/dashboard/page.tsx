import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import StatusSelect from './StatusSelect';
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
import type { Inquiry } from '@/lib/validations/inquiry';

export default async function OutfitterLeadsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  
  if (!sessionCookie) redirect('/login?redirect=/outfitter/dashboard/leads');

  let uid: string;
  try {
    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    if (decodedToken.role !== 'OUTFITTER') redirect('/unauthorized');
    uid = decodedToken.uid;
  } catch (error) {
    redirect('/login?redirect=/outfitter/dashboard/leads');
  }

  // Fetch inquiries for this outfitter
  const snapshot = await adminDb.collection('inquiries')
    .where('outfitterId', '==', uid)
    .orderBy('createdAt', 'desc')
    .get();

  const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (Inquiry & { id: string })[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hunter Inquiries</CardTitle>
        <CardDescription>Manage and respond to your leads.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hunter</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Package Inquiry</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No leads yet. When hunters inquire about your hunts, they will appear here.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.hunterName}</TableCell>
                  <TableCell>
                    <a href={`mailto:${lead.hunterEmail}`} className="text-primary hover:underline">
                      {lead.hunterEmail}
                    </a>
                  </TableCell>
                  <TableCell>{lead.huntTitle}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground" title={lead.message}>
                    {lead.message}
                  </TableCell>
                  <TableCell className="text-right">
                    <StatusSelect inquiryId={lead.id} currentStatus={lead.status} />
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