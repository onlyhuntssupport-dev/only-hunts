"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getHuntById, updateHuntStatus } from "@/app/actions/hunts";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Tag, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function HuntDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  
  const [hunt, setHunt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHunt = async () => {
      const res = await getHuntById(id);
      if (res.success) setHunt(res.data);
      else alert(res.error);
      setLoading(false);
    };
    fetchHunt();
  }, [id]);

  const handleStatus = async (status: "APPROVED" | "REJECTED") => {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this listing?`)) return;
    const res = await updateHuntStatus(id, status);
    if (res.success) {
      router.push("/dashboard/hunts");
    } else {
      alert("Error updating status: " + res.error);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-800 h-10 w-10" /></div>;
  if (!hunt) return <div className="text-center py-20 text-stone-500">Hunt not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button 
        onClick={() => router.push("/dashboard/hunts")}
        className="flex items-center text-sm font-bold text-stone-500 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Marketplace
      </button>

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        {hunt.thumbnail && (
          <div className="w-full h-96 bg-stone-100 relative">
            <img src={hunt.thumbnail} alt={hunt.title} className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-black text-stone-900 mb-2">{hunt.title}</h1>
              <p className="text-sm text-stone-500 font-bold uppercase tracking-widest">Outfitter: {hunt.outfitterName}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl text-amber-800 font-black">${hunt.price}</span>
              <p className="text-xs text-stone-400 font-bold uppercase mt-1">Status: {hunt.status}</p>
            </div>
          </div>

          <div className="flex gap-6 border-y border-stone-100 py-4 mb-6">
            <div className="flex items-center gap-2 text-stone-600">
              <MapPin className="h-5 w-5 text-stone-400" /> {hunt.location}
            </div>
            <div className="flex items-center gap-2 text-stone-600">
              <Tag className="h-5 w-5 text-stone-400" /> {hunt.species?.join(", ")}
            </div>
          </div>

          {hunt.status === "PENDING" && (
            <div className="flex gap-4 pt-4">
              <Button onClick={() => handleStatus("APPROVED")} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-lg h-14">
                <CheckCircle className="mr-2 h-5 w-5" /> Approve Listing
              </Button>
              <Button onClick={() => handleStatus("REJECTED")} variant="destructive" className="flex-1 text-lg h-14">
                <XCircle className="mr-2 h-5 w-5" /> Reject Listing
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}