import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Mail } from 'lucide-react';
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
  const sessionCookie = cookies().get('__session')?.value;
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
              <TableHead>Package Inquiry</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No inquiries yet.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="font-medium">{lead.hunterName}</div>
                    <a href={`mailto:${lead.hunterEmail}`} className="text-sm text-muted-foreground hover:underline flex items-center gap-1.5 mt-1">
                      <Mail size={14} /> {lead.hunterEmail}
                    </a>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{lead.huntTitle}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(lead.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm text-muted-foreground truncate" title={lead.message}>
                      {lead.message}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <StatusSelect inquiryId={lead.id} currentStatus={lead.status} />
                  </TableCell>
                </tr >
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
