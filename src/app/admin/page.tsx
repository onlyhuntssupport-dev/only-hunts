"use client";

import { useState, useEffect } from "react";
import { getAdminMarketplaceStats, getAdmins } from "@/app/actions/admins";
import { Shield, DollarSign, Search, ExternalLink, Activity, History, AlertTriangle, ChevronRight, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import KuduLoader from "@/components/ui/KuduLoader";

export default function AdminTeamDashboard() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [sRes, aRes] = await Promise.all([
        getAdminMarketplaceStats(),
        getAdmins()
      ]);
      
      if (sRes.success) setStats(sRes.stats);
      if (aRes && aRes.success) setAdmins(aRes.data);
      
      setLoading(false);
    };
    load();
  }, []);

  const filteredAdmins = admins.filter(item => 
    (item.name || item.companyName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 flex-1 flex flex-col h-full overflow-y-auto w-full">
      
      {/* GLOBAL STATS WIDGET */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <QuickStat icon={DollarSign} label="Pipeline Value" value={`$${stats?.totalGmv?.toLocaleString() || 0}`} color="bg-green-500" />
        <QuickStat icon={Activity} label="Total Quotes" value={stats?.totalQuotes || 0} color="bg-blue-500" />
        <QuickStat icon={AlertTriangle} label="Pending Reviews" value={stats?.pendingRequests || 0} color="bg-red-500" />
      </div>

      {/* TEAM DIRECTORY TABLE */}
      <div className="bg-white dark:bg-stone-900 border-2 border-kalahari/20 rounded-3xl overflow-hidden shadow-xl flex-1 flex flex-col">
        <div className="p-6 border-b border-kalahari/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-black text-olive dark:text-off-white uppercase">Internal Team Directory</h2>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-olive/30" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-off-white dark:bg-stone-950 border border-kalahari/10 rounded-full text-sm font-bold focus:ring-2 focus:ring-kalahari transition-all outline-none text-olive dark:text-off-white" 
              placeholder="Search staff..." 
            />
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-kalahari/5 text-[10px] font-black uppercase tracking-widest text-olive/50 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-8 py-4 border-b border-kalahari/10">Staff Member</th>
                <th className="px-8 py-4 border-b border-kalahari/10">System Role</th>
                <th className="px-8 py-4 border-b border-kalahari/10 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kalahari/5">
              {loading ? (
                <tr><td colSpan={3} className="py-20 text-center"><KuduLoader /></td></tr>
              ) : filteredAdmins.length === 0 ? (
                <tr><td colSpan={3} className="py-20 text-center text-olive/50 font-bold">No staff records found.</td></tr>
              ) : filteredAdmins.map(admin => (
                <tr key={admin.id} className="hover:bg-kalahari/5 transition-colors group cursor-pointer" onClick={() => setSelectedAdmin(admin)}>
                  <td className="px-8 py-5">
                    <p className="font-black text-olive dark:text-off-white">{admin.name || "Unknown"}</p>
                    <p className="text-xs font-medium text-olive/50">{admin.email}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-kalahari flex items-center gap-1.5 font-bold text-xs uppercase">
                      <Shield className="h-3.5 w-3.5" /> {admin.role}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Button variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity text-olive dark:text-off-white">
                      Inspect <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLIDE-OUT DOSSIER (STAFF PANEL) */}
      {selectedAdmin && (
        <div className="absolute inset-y-0 right-0 w-full lg:w-[450px] bg-white dark:bg-stone-900 shadow-[-20px_0_50px_rgba(0,0,0,0.2)] z-50 animate-in slide-in-from-right duration-300 border-l-4 border-kalahari overflow-y-auto">
          <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div className="h-16 w-16 bg-kalahari/10 rounded-2xl flex items-center justify-center text-kalahari text-2xl font-black">
                {(selectedAdmin.name || "?").charAt(0)}
              </div>
              <button onClick={() => setSelectedAdmin(null)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-olive dark:text-off-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <h3 className="text-2xl font-black text-olive dark:text-off-white leading-tight mb-2">
              {selectedAdmin.name || "Unknown Admin"}
            </h3>
            <p className="text-kalahari font-bold text-sm mb-6 flex items-center gap-2">
               <Mail className="h-4 w-4" /> {selectedAdmin.email}
            </p>

            <div className="space-y-4 flex-1">
              <DossierItem icon={History} label="Account Created" value={selectedAdmin.createdAt ? new Date(selectedAdmin.createdAt).toLocaleDateString() : "Unknown"} />
              <DossierItem icon={ExternalLink} label="System Role" value={selectedAdmin.role} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SMALL UI HELPERS ---

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

function DossierItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3 p-4 bg-off-white dark:bg-stone-950 rounded-xl border border-kalahari/10">
      <Icon className="h-5 w-5 text-kalahari" />
      <div>
        <p className="text-[10px] font-black uppercase text-olive/40 tracking-widest">{label}</p>
        <p className="text-sm font-bold text-olive dark:text-off-white">{value}</p>
      </div>
    </div>
  );
}