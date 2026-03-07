'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { createOutfitter } from '@/app/actions/outfitters';
import { ShieldCheck, Clock, Ban, Loader2, X, Eye, EyeOff, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Outfitter { id: string; name?: string; owner?: string; email?: string; status?: string; dateApplied?: string; [key: string]: any; }

const getStatusBadge = (status: string = 'PENDING') => {
  const s = status.toUpperCase();
  if (s === 'ACTIVE') return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Active</span>;
  if (s === 'PENDING') return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700"><Clock className="h-3.5 w-3.5" /> Pending</span>;
  if (s === 'SUSPENDED') return <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"><Ban className="h-3.5 w-3.5" /> Suspended</span>;
  return <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{s}</span>;
};

export default function OutfittersPage() {
  const [outfitters, setOutfitters] = useState<Outfitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchOutfitters = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'OUTFITTER')));
      const data: Outfitter[] = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() } as Outfitter));
      setOutfitters(data);
    } catch (err: any) {
      setError(err.code === 'permission-denied' ? "Permission denied." : "Failed to load outfitters.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOutfitters(); }, []);

  const handleCreateOutfitter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');
    try {
      const result = await createOutfitter(new FormData(e.currentTarget));
      if (result.error) {
        setModalError(`Server Error: ${result.error}`);
      } else { 
        setIsModalOpen(false); 
        setShowPassword(false); 
        fetchOutfitters(); 
      }
    } catch (err: any) {
      setModalError(`System Crash: ${err?.message || String(err)}`);
      console.error("Raw Crash Data:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Outfitters</h1>
          <p className="text-muted-foreground mt-2">Manage outfitter accounts, review applications, and monitor platform access.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Invite Outfitter</Button>
      </div>

      <div className="rounded-md border bg-card">
        <div className="relative w-full overflow-auto min-h-[300px]">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-muted/50">
              <tr className="border-b transition-colors">
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Business Name</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Owner</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Email</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-right font-medium text-muted-foreground">Verification Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="h-48 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /> Loading...</td></tr>}
              {!loading && error && <tr><td colSpan={5} className="h-48 text-center text-destructive">{error}</td></tr>}
              {!loading && !error && outfitters.length === 0 && <tr><td colSpan={5} className="h-48 text-center text-muted-foreground">No outfitters found.</td></tr>}
              {!loading && !error && outfitters.map((o) => (
                <tr key={o.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium">{o.name || 'N/A'}</td>
                  <td className="p-4 align-middle">{o.owner || 'Unknown'}</td>
                  <td className="p-4 align-middle text-muted-foreground">{o.email || 'N/A'}</td>
                  <td className="p-4 align-middle">{getStatusBadge(o.status)}</td>
                  <td className="p-4 align-middle text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" title="View"><FileText className="h-4 w-4 mr-1" /> View</Button>
                      <Button variant="outline" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Verify"><CheckCircle className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Suspend"><Ban className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Invite New Outfitter</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleCreateOutfitter} className="space-y-4">
              <div className="space-y-2"><label className="text-sm font-medium">Business Name *</label><Input name="name" required /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Owner Full Name *</label><Input name="owner" required /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Email Address *</label><Input type="email" name="email" required /></div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Temporary Password *</label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} name="password" required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t mt-4">
                <label className="text-sm font-medium">Outfitter Permit *</label>
                <Input type="file" name="permit" accept=".pdf, image/jpeg, image/png" className="cursor-pointer" required />
                <p className="text-xs text-muted-foreground">Required for verification.</p>
              </div>
              {modalError && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md font-medium mt-4">{modalError}</div>}
              <div className="flex justify-end gap-3 pt-6">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Create Outfitter'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}