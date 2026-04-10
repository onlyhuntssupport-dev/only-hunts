"use client";

import { useState, useEffect } from "react";
import { getAdminMarketplaceStats } from "@/app/actions/admins";
import { Activity, DollarSign, AlertTriangle, Search, Target } from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";

export default function AdminPipelineDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]); // Will hold real quotes later
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const sRes = await getAdminMarketplaceStats();
      if (sRes.success) setStats(sRes.stats);
      
      // TODO: Replace with actual `await getAllQuotes()` when backend action is ready
      setQuotes([]); 
      
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="p-4 sm:p-8 flex-1 flex flex-col h-full overflow-y-auto w-full">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <QuickStat icon={DollarSign} label="Pipeline Value" value={`$${stats?.totalGmv?.toLocaleString() || 0}`} color="bg-green-500" />
        <QuickStat icon={Activity} label="Total Quotes" value={stats?.totalQuotes || 0} color="bg-blue-500" />
        <QuickStat icon={AlertTriangle} label="Pending Reviews" value={stats?.pendingRequests || 0} color="bg-red-500" />
      </div>

      <div className="bg-white dark:bg-stone-900 border-2 border-kalahari/20 rounded-3xl overflow-hidden shadow-xl flex-1 flex flex-col">
        <div className="p-6 border-b border-kalahari/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-black text-olive dark:text-off-white uppercase flex items-center gap-2">
            <Target className="h-6 w-6 text-kalahari" /> Active Quote Flow
          </h2>
          
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-olive/30" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-off-white dark:bg-stone-950 border border-kalahari/10 rounded-full text-sm font-bold focus:ring-2 focus:ring-kalahari transition-all outline-none text-olive dark:text-off-white" 
              placeholder="Search by ID or Hunter..." 
            />
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-kalahari/5 text-[10px] font-black uppercase tracking-widest text-olive/50 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-8 py-4 border-b border-kalahari/10">Date</th>
                <th className="px-8 py-4 border-b border-kalahari/10">Hunter</th>
                <th className="px-8 py-4 border-b border-kalahari/10">Outfitter</th>
                <th className="px-8 py-4 border-b border-kalahari/10 text-right">Quote Value</th>
                <th className="px-8 py-4 border-b border-kalahari/10">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kalahari/5">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center"><KuduLoader /></td></tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-olive/50 font-bold">
                    No active quotes found in the pipeline.
                  </td>
                </tr>
              ) : (
                // Map real quotes here later
                null
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border-2 border-kalahari/10 flex items-center gap-5">
      <div className={`h-12 w-12 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg shadow-black/5`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-olive/40">{label}</p>
        <p className="text-xl font-black text-olive dark:text-off-white">{value}</p>
      </div>
    </div>
  );
}