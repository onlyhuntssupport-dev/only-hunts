"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getGlobalEntities } from "@/app/actions/admins";
import { Store, Search, CheckCircle, AlertTriangle, ChevronRight, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import KuduLoader from "@/components/ui/KuduLoader";

export default function AdminOutfittersDashboard() {
  const router = useRouter();
  const [outfitters, setOutfitters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await getGlobalEntities("outfitter");
      if (res && res.success) setOutfitters(res.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = outfitters.filter(item => 
    (item.companyName || item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    // FIXED: Removed h-full and overflow-y-auto. Added min-h-screen.
    <div className="p-4 sm:p-8 w-full relative min-h-screen flex flex-col pb-24">
      <div className="bg-white dark:bg-stone-900 border-2 border-kalahari/20 rounded-3xl overflow-hidden shadow-xl flex flex-col">
        <div className="p-6 border-b border-kalahari/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-black text-olive dark:text-off-white uppercase flex items-center gap-2">
            <Store className="h-6 w-6 text-kalahari" /> Outfitter Directory
          </h2>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-olive/30" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-off-white dark:bg-stone-950 border border-kalahari/10 rounded-full text-sm font-bold focus:ring-2 focus:ring-kalahari transition-all outline-none text-olive dark:text-off-white" 
              placeholder="Search outfitters..." 
            />
          </div>
        </div>

        {/* Table wrapper remains overflow-auto ONLY for horizontal swiping on mobile */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-kalahari/5 text-[10px] font-black uppercase tracking-widest text-olive/50 border-b border-kalahari/10">
              <tr>
                <th className="px-8 py-4">Company / Name</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kalahari/5">
              {loading ? (
                <tr><td colSpan={3} className="py-20 text-center"><KuduLoader /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={3} className="py-20 text-center text-olive/50 font-bold">No outfitters found.</td></tr>
              ) : filtered.map(e => (
                <tr 
                  key={e.id} 
                  className="hover:bg-kalahari/5 transition-colors group cursor-pointer" 
                  onClick={() => router.push(`/admin/outfitters/${e.id}`)}
                >
                  <td className="px-8 py-5">
                    <p className="font-black text-olive dark:text-off-white">{e.companyName || e.name || "Unknown"}</p>
                    <p className="text-xs font-medium text-olive/50">{e.email}</p>
                  </td>
                  <td className="px-8 py-5">
                    {e.status === "VERIFIED" ? (
                      <span className="text-green-600 flex items-center gap-1.5 font-bold text-xs uppercase"><CheckCircle className="h-3.5 w-3.5" /> Verified</span>
                    ) : e.status === "SUSPENDED" ? (
                      <span className="text-orange-500 flex items-center gap-1.5 font-bold text-xs uppercase"><PauseCircle className="h-3.5 w-3.5" /> Suspended</span>
                    ) : (
                      <span className="text-amber-500 flex items-center gap-1.5 font-bold text-xs uppercase"><AlertTriangle className="h-3.5 w-3.5" /> Pending</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Button variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity text-olive dark:text-off-white">
                      Manage <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}