import { adminDb } from '@/lib/firebase/admin';
import { CheckCircle, XCircle, FileText, ExternalLink } from 'lucide-react';
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
import { revalidatePath } from 'next/cache';

// --- SERVER ACTIONS ---
// We handle the database updates securely on the server
async function approveDocument(docId: string, outfitterId: string) {
  'use server';
  
  // 1. Mark document as Verified
  await adminDb.collection('outfitter_documents').doc(docId).update({
    status: 'VERIFIED',
    verifiedAt: new Date(),
  });

  // 2. Update Outfitter's global profile status
  await adminDb.collection('outfitters').doc(outfitterId).update({
    verificationStatus: 'VERIFIED',
  });

  revalidatePath('/admin/dashboard/verifications');
}

async function rejectDocument(docId: string, outfitterId: string) {
  'use server';
  
  await adminDb.collection('outfitter_documents').doc(docId).update({
    status: 'REJECTED',
    verifiedAt: new Date(),
  });

  await adminDb.collection('outfitters').doc(outfitterId).update({
    verificationStatus: 'REQUIRES_ACTION',
  });

  revalidatePath('/admin/dashboard/verifications');
}

export default async function VerificationsPage() {
  // Fetch pending documents from the vault we built in Module 9/10
  const pendingSnapshot = await adminDb
    .collection('outfitter_documents')
    .where('status', '==', 'PENDING')
    .get();

  const pendingDocuments = pendingSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as { 
      outfitterId: string;
      type: string;
      fileName: string;
      fileUrl: string;
      expiryDate: string | null;
    }),
  }));

  return (
    <Card className="border-gray-800 bg-gray-900 text-white">
      <CardHeader>
        <CardTitle className="text-2xl text-orange-500">Outfitter Verifications</CardTitle>
        <CardDescription className="text-gray-400">
          Review and approve pending outfitter permits and licenses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader className="border-gray-800">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-gray-400">Outfitter UID</TableHead>
              <TableHead className="text-gray-400">Document Info</TableHead>
              <TableHead className="text-gray-400">License File</TableHead>
              <TableHead className="text-right text-gray-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-gray-800">
            {pendingDocuments.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                  No pending applications in the vault.
                </TableCell>
              </TableRow>
            ) : (
              pendingDocuments.map((doc) => {
                // Bind the arguments to the server actions for secure submission
                const handleApprove = approveDocument.bind(null, doc.id, doc.outfitterId);
                const handleReject = rejectDocument.bind(null, doc.id, doc.outfitterId);

                return (
                  <TableRow key={doc.id} className="border-gray-800 hover:bg-gray-800/50">
                    <TableCell>
                      <div className="font-medium text-white">
                        {doc.outfitterId.slice(0, 8)}...
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-medium text-orange-400">
                        {doc.type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-gray-400">
                        Expiry: {doc.expiryDate || 'N/A'}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <a 
                        href={doc.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-sm font-medium text-blue-400 hover:text-blue-300"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        <span className="truncate max-w-[150px]">{doc.fileName}</span>
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <form action={handleApprove}>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        </form>
                        <form action={handleReject}>
                          <Button size="sm" variant="destructive" className="bg-red-900/80 hover:bg-red-900 text-white">
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}