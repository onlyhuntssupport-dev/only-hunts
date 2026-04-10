"use client";

import { useEffect, useState } from "react";
import { getOutfitters, updateOutfitterStatus, createOutfitter, deleteAdminAccount } from "@/app/actions/outfitters";
// NEW IMPORT: Universal storage helper
import { uploadWithCompression } from "@/lib/firebase/storageHelper"; 
import { Ban, CheckCircle, Clock, Loader2, UserPlus, User, X, FileText, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Outfitter {
  id: string;
  name?: string;
  email?: string;
  status?: string;
  createdAt?: string;
  rejectionReason?: string;
  permitUrl?: string;
  [key: string]: any;
}

const getStatusBadge = (status: string = "PENDING") => {
  const s = status.toUpperCase();
  if (s === "ACTIVE") return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"><CheckCircle className="h-3.5 w-3.5" /> Active</span>;
  if (s === "REJECTED") return <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"><Ban className="h-3.5 w-3.5" /> Rejected</span>;
  if (s === "SUSPENDED") return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700"><Ban className="h-3.5 w-3.5" /> Suspended</span>;
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"><Clock className="h-3.5 w-3.5" /> Pending</span>;
};

export default function OutfittersPage() {
  const [outfitters, setOutfitters] = useState<Outfitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOutfitter, setSelectedOutfitter] = useState<Outfitter | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadOutfitters = async () => {
    setLoading(true);
    try {
      const result = await getOutfitters();
      if (result.success && result.data) {
        setOutfitters(result.data as Outfitter[]);
      } else {
        setError(result.error || "Failed to load outfitters.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOutfitters(); }, []);

  const handleStatusUpdate = async (status: "ACTIVE" | "REJECTED") => {
    if (!selectedOutfitter) return;
    if (status === "REJECTED" && !rejectReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await updateOutfitterStatus(selectedOutfitter.id, status, status === "REJECTED" ? rejectReason : undefined);
      if (result.success) {
        await loadOutfitters();
        closeReviewModal();
      } else {
        alert(result.error || "Failed to update status");
      }
    } catch (err) {
      alert("An error occurred while updating.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteOutfitter = async (outfitter: Outfitter) => {
    const confirmed = window.confirm(`DANGER: This will permanently delete ${outfitter.name || outfitter.email} and revoke their login access forever. Proceed?`);
    
    if (confirmed) {
      setDeletingId(outfitter.id);
      const result = await deleteAdminAccount(outfitter.id);
      if (result.success) {
        setOutfitters(prev => prev.filter(o => o.id !== outfitter.id));
      } else {
        alert("Error: " + result.error);
      }
      setDeletingId(null);
    }
  };

  const handleInviteOutfitter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsInviting(true);
    setInviteError("");
    setUploadStatus("Starting upload...");

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const file = formData.get("permitDocument") as File;

      if (!file || file.size === 0) {
        setInviteError("A valid permit document (PDF or Image) is required.");
        setIsInviting(false);
        return;
      }

      setUploadStatus("Uploading permit document...");
      const fileExtension = file.name.split('.').pop();
      const fileName = `outfitter_permits/${Date.now()}_${formData.get("name")?.toString().replace(/\s+/g, '_')}.${fileExtension}`;
      
      // NEW CODE: Using the universal compression helper
      const downloadUrl = await uploadWithCompression(file, fileName);

      formData.append("permitUrl", downloadUrl);

      setUploadStatus("Creating account...");
      const result = await createOutfitter(formData);
      
      if (result.success) {
        await loadOutfitters();
        setIsInviteModalOpen(false);
      } else {
        setInviteError(result.error || "Failed to invite outfitter.");
      }
    } catch (err: any) {
      setInviteError(err.message || "Failed to upload document or create account.");
    } finally {
      setIsInviting(false);
      setUploadStatus("");
    }
  };

  const closeReviewModal = () => {
    setSelectedOutfitter(null);
    setRejectMode(false);
    setRejectReason("");
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Outfitters</h1>
          <p className="text-muted-foreground mt-2">Manage outfitter accounts and verify documents.</p>
        </div>
        <Button className="gap-2 bg-amber-800 hover:bg-amber-900 text-white" onClick={() => setIsInviteModalOpen(true)}>
          <UserPlus className="h-4 w-4" /> Invite Outfitter
        </Button>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <div className="relative w-full overflow-auto min-h-[300px]">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-muted/50">
              <tr className="border-b transition-colors">
                <th className="h-12 px-4 text-left font-medium">Name</th>
                <th className="h-12 px-4 text-left font-medium">Status</th>
                <th className="h-12 px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="h-48 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></td></tr>
              ) : outfitters.map((outfitter) => (
                <tr key={outfitter.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {outfitter.name || "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground ml-6">{outfitter.email}</div>
                  </td>
                  <td className="p-4 align-middle">{getStatusBadge(outfitter.status)}</td>
                  <td className="p-4 align-middle text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedOutfitter(outfitter)}>Manage</Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteOutfitter(outfitter)}
                        disabled={deletingId === outfitter.id}
                      >
                        {deletingId === outfitter.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOutfitter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-lg">
             <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Review Outfitter</h2>
              <Button variant="ghost" size="icon" onClick={closeReviewModal}><X className="h-4 w-4" /></Button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm text-stone-900 font-medium">
                <p className="text-muted-foreground font-normal">Name: {selectedOutfitter.name}</p>
                <p className="text-muted-foreground font-normal">Email: {selectedOutfitter.email}</p>
                
                <div className="col-span-2 mt-2">
                  <p className="text-muted-foreground mb-1">Permit Document</p>
                  {selectedOutfitter.permitUrl ? (
                    <a href={selectedOutfitter.permitUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                      <FileText className="h-4 w-4" /> View Document <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-xs italic">No document attached.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={closeReviewModal}>Close</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleStatusUpdate("ACTIVE")}>Approve</Button>
            </div>
          </div>
        </div>
      )}

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
             <h2 className="text-xl font-semibold mb-4">Invite & Verify Outfitter</h2>
             <form onSubmit={handleInviteOutfitter} className="space-y-4">
                <Input name="name" required placeholder="Business Name" disabled={isInviting} />
                <Input type="email" name="email" required placeholder="Email Address" disabled={isInviting} />
                <Input type="password" name="password" required minLength={6} placeholder="Temp Password" disabled={isInviting} />
                <div className="border-t pt-2">
                  <label className="text-xs font-semibold uppercase text-stone-500">Permit Document</label>
                  <Input type="file" name="permitDocument" accept=".pdf,image/*" required disabled={isInviting} className="mt-1" />
                </div>
                {inviteError && <div className="text-destructive text-sm font-medium">{inviteError}</div>}
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isInviting} className="bg-amber-800 text-white">
                    {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                  </Button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}