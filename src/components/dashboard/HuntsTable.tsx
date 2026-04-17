'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { MoreHorizontal, PlusCircle } from 'lucide-react';

import { deleteHunt } from '@/app/actions/hunts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

// Simplified type for client component props
type Hunt = {
  id: string;
  title: string;
  basePrice: number;
  baseCurrency: 'USD' | 'EUR' | 'ZAR';
  status: 'pending' | 'active' | 'rejected';
  createdAt: string;
};

export default function HuntsTable({ initialHunts }: { initialHunts: Hunt[] }) {
  const [hunts, setHunts] = useState(initialHunts);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [huntToDelete, setHuntToDelete] = useState<Hunt | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDeleteClick = (hunt: Hunt) => {
    setHuntToDelete(hunt);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (!huntToDelete) return;

    startTransition(async () => {
      const result = await deleteHunt(huntToDelete.id);

      if (result.success) {
        setHunts((prevHunts) => prevHunts.filter((h) => h.id !== huntToDelete.id));
        toast({ title: 'Hunt Deleted', description: `"${huntToDelete.title}" has been removed.` });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
      setShowDeleteDialog(false);
      setHuntToDelete(null);
    });
  };

  const statusVariant: { [key: string]: BadgeProps['variant'] } = {
    active: 'default',
    pending: 'secondary',
    rejected: 'destructive',
  };

  if (hunts.length === 0) {
    return (
      <div className="text-center p-12 border-2 border-dashed rounded-lg bg-card mt-6">
        <h3 className="text-xl font-semibold">No hunts found.</h3>
        <p className="text-muted-foreground mt-2 mb-6">Get started by creating your first hunting package.</p>
        <Button asChild>
          <Link href="/outfitter/dashboard/create">
            <PlusCircle />
            Create Your First Hunt
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your Listings</CardTitle>
          <CardDescription>An overview of all your submitted hunt packages.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hunts.map((hunt) => (
                <TableRow key={hunt.id}>
                  <TableCell className="font-medium">{hunt.title}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[hunt.status] || 'secondary'} className='capitalize'>{hunt.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: hunt.baseCurrency }).format(hunt.basePrice)}
                  </TableCell>
                  <TableCell>
                    {new Date(hunt.createdAt).toLocaleDateString('en-US', {day: '2-digit', month: 'short', year: 'numeric'})}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteClick(hunt)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the hunt
              package "{huntToDelete?.title}" from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}