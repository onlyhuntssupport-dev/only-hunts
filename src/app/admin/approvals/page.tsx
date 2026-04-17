export const dynamic = 'force-dynamic';

import { approveHuntListing, approveOutfitter } from '@/app/actions/admins';
import { adminDb } from '@/lib/firebase/admin';
import { CheckCircle, ExternalLink, ShieldCheck, Map, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Hunt } from '@/lib/validations/hunt';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export default async function ApprovalsPage() {
  // 1. Fetch Pending Hunts
  const pendingHuntsSnapshot = await adminDb
    .collection('hunts')
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .get();

  const pendingHunts = pendingHuntsSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(), 
    } as Hunt & { id: string };
  });

  // 2. Fetch Pending Outfitters
  const pendingOutfittersSnapshot = await adminDb
    .collection('outfitters')
    .where('status', '==', 'PENDING')
    .orderBy('createdAt', 'desc')
    .get();

  const pendingOutfitters = pendingOutfittersSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    };
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">Platform Approvals</h1>
        <p className="text-stone-500 font-medium mt-1">Review and verify new outfitters and hunt packages.</p>
      </div>

      <Tabs defaultValue="outfitters" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
          <TabsTrigger value="outfitters" className="font-bold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Pending Outfitters
            {pendingOutfitters.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{pendingOutfitters.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="hunts" className="font-bold flex items-center gap-2">
            <Map className="h-4 w-4" /> Pending Hunts
            {pendingHunts.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{pendingHunts.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ========================================== */}
        {/* TAB 1: OUTFITTERS                          */}
        {/* ========================================== */}
        <TabsContent value="outfitters">
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="bg-stone-50 border-b border-stone-100 pb-4">
              <CardTitle>Outfitter Verifications</CardTitle>
              <CardDescription>
                Verify industry affiliations and permits. Approving an outfitter immediately starts their 14-day free trial.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6 py-4">Business Details</TableHead>
                    <TableHead>Location & Affiliations</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead className="text-right px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingOutfitters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-stone-500 font-medium">
                        <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        No pending outfitter applications.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingOutfitters.map((outfitter: any) => (
                      <TableRow key={outfitter.id} className="hover:bg-stone-50/50">
                        <TableCell className="px-6 py-4">
                          <div className="font-black text-stone-900">{outfitter.name}</div>
                          <div className="text-sm text-stone-500 font-medium">{outfitter.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-stone-700">{outfitter.location}</div>
                          {outfitter.affiliations ? (
                            <div className="text-xs font-bold text-amber-700 mt-1 uppercase tracking-wider bg-amber-50 inline-block px-2 py-1 rounded-md border border-amber-200">
                              {outfitter.affiliations}
                            </div>
                          ) : (
                            <div className="text-xs font-bold text-stone-400 mt-1 uppercase tracking-wider">No Affiliations Listed</div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-stone-600">
                          {new Date(outfitter.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right px-6 space-x-2 whitespace-nowrap">
                          {/* View Permit Button */}
                          {outfitter.permitUrl && (
                            <Button variant="outline" size="sm" asChild className="border-stone-300 font-bold">
                              <Link href={outfitter.permitUrl} target="_blank" title="View Uploaded Permit">
                                <FileText className="mr-2 h-4 w-4 text-stone-500" /> View Permit
                              </Link>
                            </Button>
                          )}
                          
                          {/* Approve Outfitter Action */}
                          <form
                            action={async () => {
                              'use server';
                              await approveOutfitter(outfitter.id);
                              revalidatePath('/admin/approvals');
                            }}
                            className="inline-block"
                          >
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve & Start Trial
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
        </TabsContent>

        {/* ========================================== */}
        {/* TAB 2: HUNT LISTINGS                       */}
        {/* ========================================== */}
        <TabsContent value="hunts">
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="bg-stone-50 border-b border-stone-100 pb-4">
              <CardTitle>Hunt Listing Approvals</CardTitle>
              <CardDescription>
                Review and approve new hunt packages. Approved hunts will become instantly visible on the marketplace.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6 py-4">Hunt Details</TableHead>
                    <TableHead>Outfitter</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingHunts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-stone-500 font-medium">
                        <Map className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        No pending hunt approvals.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingHunts.map((hunt) => (
                      <TableRow key={hunt.id} className="hover:bg-stone-50/50">
                        <TableCell className="px-6 py-4">
                          <div className="font-black text-stone-900">{hunt.title}</div>
                          <div className="text-sm text-stone-500 font-medium mt-1">
                            {/* OVERRIDE: Cast hunt as any to access baseCurrency and basePrice */}
                            {hunt.province} &bull; {new Intl.NumberFormat('en-US', { style: 'currency', currency: (hunt as any).baseCurrency || 'USD' }).format((hunt as any).basePrice || 0)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-stone-700">{hunt.outfitterName}</TableCell>
                        <TableCell className="text-sm font-medium text-stone-600">
                           {/* OVERRIDE: Cast hunt as any to access createdAt safely */}
                          {new Date((hunt as any).createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right px-6 space-x-2 whitespace-nowrap">
                          <Button variant="outline" size="sm" asChild className="border-stone-300 font-bold">
                            <Link href={`/hunts/${hunt.id}`} target="_blank" title="Preview Listing Page">
                              <ExternalLink className="mr-2 h-4 w-4 text-stone-500" /> Preview
                            </Link>
                          </Button>
                          <form
                            action={async () => {
                              'use server';
                              await approveHuntListing(hunt.id);
                              revalidatePath('/admin/approvals');
                            }}
                            className="inline-block"
                          >
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}