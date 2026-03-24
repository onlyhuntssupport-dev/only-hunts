"use client";

import { useEffect, useState } from "react";
import { getAllHunts, updateHuntStatus, deleteHunt } from "@/app/actions/hunts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle, Trash2 } from "lucide-react";

type Hunt = {
  id: string;
  title?: string;
  outfitterId?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  price?: number;
  adminNote?: string;
};

export default function AdminMarketplacePage() {
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // State for the rejection note UI
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");

  const fetchHunts = async () => {
    setLoading(true);
    const res = await getAllHunts();
    if (res.success && res.data) {
      setHunts(res.data as Hunt[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHunts();
  }, []);

  const handleApprove = async (huntId: string) => {
    setProcessingId(huntId);
    const res = await updateHuntStatus(huntId, "APPROVED");
    if (res.success) {
      setHunts((prev) => 
        prev.map((h) => h.id === huntId ? { ...h, status: "APPROVED", adminNote: "" } : h)
      );
    } else {
      alert("Failed to approve hunt.");
    }
    setProcessingId(null);
  };

  const handleReject = async (huntId: string) => {
    setProcessingId(huntId);
    const res = await updateHuntStatus(huntId, "REJECTED", rejectionNote);
    if (res.success) {
      setHunts((prev) => 
        prev.map((h) => h.id === huntId ? { ...h, status: "REJECTED", adminNote: rejectionNote } : h)
      );
      setRejectingId(null);
      setRejectionNote("");
    } else {
      alert("Failed to reject hunt.");
    }
    setProcessingId(null);
  };

  const handleDelete = async (huntId: string) => {
    const isConfirmed = window.confirm("Are you sure you want to permanently delete this listing? This action cannot be undone.");
    if (!isConfirmed) return;

    setProcessingId(huntId);
    const res = await deleteHunt(huntId);
    if (res.success) {
      setHunts((prev) => prev.filter((h) => h.id !== huntId));
    } else {
      alert("Failed to delete hunt.");
    }
    setProcessingId(null);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-kalahari" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-headline font-bold text-olive dark:text-off-white tracking-tight">Marketplace Approvals</h1>
        <p className="text-olive dark:text-off-white/70 mt-1 font-medium">
          Review, approve, reject, or delete hunting packages submitted by outfitters.
        </p>
      </div>

      {hunts.length === 0 ? (
        <div className="text-center border-2 border-dashed border-kalahari/50 rounded-xl p-12 bg-white shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-kalahari mb-4" />
          <h3 className="text-xl font-bold text-olive dark:text-off-white">No Hunts Found</h3>
          <p className="text-olive dark:text-off-white/70 mt-1">There are currently no listings in the database.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-kalahari/30 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-olive dark:text-off-white uppercase bg-kalahari/10 border-b-2 border-kalahari/30">
                <tr>
                  <th className="px-6 py-4 font-black">Package Details</th>
                  <th className="px-6 py-4 font-black">Status</th>
                  <th className="px-6 py-4 font-black">Submitted</th>
                  <th className="px-6 py-4 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kalahari/20">
                {hunts.map((hunt) => (
                  <tr key={hunt.id} className="hover:bg-off-white transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-olive dark:text-off-white text-base">{hunt.title || "Untitled Package"}</div>
                      <div className="text-olive dark:text-off-white/60 text-xs mt-1 font-medium">
                        Outfitter ID: {hunt.outfitterId ? `${hunt.outfitterId.slice(0, 8)}...` : "Unknown ID"}
                      </div>
                      {hunt.price && <div className="text-olive dark:text-off-white font-black mt-1.5">${hunt.price.toLocaleString()}</div>}
                    </td>
                    
                    <td className="px-6 py-5">
                      {hunt.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
                          <Clock className="h-3.5 w-3.5" /> Pending
                        </span>
                      )}
                      {hunt.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-green-100 text-green-800 text-xs font-bold border border-green-200">
                          <CheckCircle className="h-3.5 w-3.5" /> Approved
                        </span>
                      )}
                      {hunt.status === "REJECTED" && (
                        <div className="flex flex-col gap-1.5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-red-100 text-red-800 text-xs font-bold border border-red-200 w-fit">
                            <XCircle className="h-3.5 w-3.5" /> Rejected
                          </span>
                          {hunt.adminNote && (
                            <span className="text-xs text-olive dark:text-off-white/60 font-medium italic max-w-xs">Note: {hunt.adminNote}</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-5 text-olive dark:text-off-white/70 font-medium">
                      {new Date(hunt.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-5 text-right">
                      {rejectingId === hunt.id ? (
                        <div className="flex flex-col items-end gap-2 min-w-[250px]">
                          <Input 
                            placeholder="Optional reason for rejection..." 
                            value={rejectionNote}
                            onChange={(e) => setRejectionNote(e.target.value)}
                            className="text-sm border-kalahari/50 focus-visible:ring-olive"
                          />
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-kalahari text-olive dark:text-off-white hover:bg-kalahari/10 font-bold"
                              onClick={() => { setRejectingId(null); setRejectionNote(""); }}
                              disabled={processingId === hunt.id}
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="font-bold shadow-sm"
                              onClick={() => handleReject(hunt.id)}
                              disabled={processingId === hunt.id}
                            >
                              {processingId === hunt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Reject"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end items-center gap-2">
                          {hunt.status !== "APPROVED" && (
                            <Button 
                              size="sm" 
                              className="bg-olive hover:bg-olive/90 text-kalahari font-bold shadow-sm"
                              onClick={() => handleApprove(hunt.id)}
                              disabled={processingId === hunt.id}
                            >
                              {processingId === hunt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
                            </Button>
                          )}
                          {hunt.status !== "REJECTED" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-kalahari text-olive dark:text-off-white hover:bg-kalahari/10 font-bold"
                              onClick={() => setRejectingId(hunt.id)}
                              disabled={processingId === hunt.id}
                            >
                              Reject
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-olive dark:text-off-white/40 hover:text-red-600 hover:bg-red-50 ml-1 transition-colors"
                            onClick={() => handleDelete(hunt.id)}
                            disabled={processingId === hunt.id}
                            title="Delete Permanently"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}