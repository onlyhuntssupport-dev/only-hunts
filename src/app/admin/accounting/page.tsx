"use client";

import { useState, useEffect } from "react";
import { getFinancialLedger } from "@/app/actions/admins";
import { Wallet, DollarSign, CheckCircle, Download, Receipt, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import KuduLoader from "@/components/ui/KuduLoader";

export default function AdminAccountingDashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [financialStats, setFinancialStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const fRes = await getFinancialLedger();
      if (fRes && fRes.success) {
        setTransactions(fRes.data);
        setFinancialStats(fRes.stats);
      }
      setLoading(false);
    };
    load();
  }, []);

  const exportLedgerCSV = () => {
    if (transactions.length === 0) return alert("No transaction data to export.");
    
    const headers = ["Transaction ID", "Date", "Entity Name", "Type", "Amount (USD)", "Status"];
    const rows = transactions.map(t => [
      t.id,
      new Date(t.createdAt).toLocaleDateString(),
      t.entityName || t.outfitterName || "Unknown",
      t.type || "SUBSCRIPTION",
      t.amount || 0,
      t.status || "PENDING"
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Only-Hunts-Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = transactions.filter(item => 
    (item.entityName || item.outfitterName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.type || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 flex-1 flex flex-col h-full overflow-y-auto w-full">
      
      {/* FINANCIAL STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <QuickStat icon={Wallet} label="Monthly Recurring (MRR)" value={`$${financialStats?.mrr?.toLocaleString() || 0}`} color="bg-kalahari" />
        <QuickStat icon={DollarSign} label="Total Cash Collected" value={`$${financialStats?.totalRevenue?.toLocaleString() || 0}`} color="bg-green-600" />
        <QuickStat icon={CheckCircle} label="Active Subscriptions" value={financialStats?.activeSubs || 0} color="bg-blue-600" />
      </div>

      <div className="bg-white dark:bg-stone-900 border-2 border-kalahari/20 rounded-3xl overflow-hidden shadow-xl flex-1 flex flex-col">
        <div className="p-6 border-b border-kalahari/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-black text-olive dark:text-off-white uppercase flex items-center gap-2">
            <Wallet className="h-6 w-6 text-kalahari" /> Global Ledger
          </h2>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-olive/30" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-off-white dark:bg-stone-950 border border-kalahari/10 rounded-full text-sm font-bold focus:ring-2 focus:ring-kalahari transition-all outline-none text-olive dark:text-off-white" 
                placeholder="Search transactions..." 
              />
            </div>
            <Button onClick={exportLedgerCSV} className="bg-kalahari hover:bg-kalahari/90 text-white font-bold gap-2 rounded-xl shrink-0">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-kalahari/5 text-[10px] font-black uppercase tracking-widest text-olive/50 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-8 py-4 border-b border-kalahari/10">Date</th>
                <th className="px-8 py-4 border-b border-kalahari/10">Entity</th>
                <th className="px-8 py-4 border-b border-kalahari/10">Transaction Type</th>
                <th className="px-8 py-4 border-b border-kalahari/10 text-right">Amount</th>
                <th className="px-8 py-4 border-b border-kalahari/10">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kalahari/5">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center"><KuduLoader /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-olive/50 font-bold">No financial data found.</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="hover:bg-kalahari/5 transition-colors">
                  <td className="px-8 py-5 text-sm font-bold text-olive/70 dark:text-off-white/70">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-5 font-black text-olive dark:text-off-white">
                    {t.entityName || t.outfitterName || "Unknown"}
                  </td>
                  <td className="px-8 py-5">
                    <span className="bg-kalahari/10 text-kalahari px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                      <Receipt className="h-3 w-3" /> {t.type || "SUBSCRIPTION"}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-olive dark:text-off-white text-lg">
                    ${(t.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-8 py-5">
                     <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                       t.status === "PAID" || t.status === "SUCCESS" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                     }`}>
                       {t.status || "PENDING"}
                     </span>
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