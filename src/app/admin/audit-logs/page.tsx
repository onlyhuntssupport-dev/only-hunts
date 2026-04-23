"use client";

import { useState, useEffect } from "react";
import { getAuditLogs } from "@/app/actions/admins";
import { Search, ShieldAlert, History, Filter } from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      const response = await getAuditLogs(200); // Fetch last 200 events
      if (response.success && response.data) {
        setLogs(response.data);
      }
      setLoading(false);
    }
    loadLogs();
  }, []);

  // Compute unique action types dynamically for the filter dropdown
  const uniqueActions = Array.from(new Set(logs.map(log => log.action))).filter(Boolean);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.performedBy || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.targetUid || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="p-4 sm:p-8 flex-1 flex flex-col h-full overflow-y-auto w-full relative">
      
      <div className="mb-8 flex items-center gap-3">
        <div className="h-12 w-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-600 dark:text-red-500 shadow-sm">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-olive dark:text-off-white uppercase tracking-tight">Security Audit Logs</h1>
          <p className="text-sm font-medium text-olive/50 dark:text-off-white/50">Immutable system activity and permission modifications.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 border-2 border-kalahari/20 rounded-3xl overflow-hidden shadow-xl flex-1 flex flex-col">
        
        {/* Controls Header */}
        <div className="p-6 border-b border-kalahari/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-off-white/50 dark:bg-stone-950/50">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-olive/30" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-stone-950 border border-kalahari/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-kalahari transition-all outline-none text-olive dark:text-off-white" 
              placeholder="Search by Admin Email or Target ID..." 
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-olive/40" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-white dark:bg-stone-950 border border-kalahari/20 rounded-xl text-sm font-bold py-2.5 pl-3 pr-8 focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white cursor-pointer"
            >
              <option value="ALL">All Event Types</option>
              {uniqueActions.map(action => (
                <option key={action as string} value={action as string}>{action as string}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-kalahari/5 text-[10px] font-black uppercase tracking-widest text-olive/50 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 border-b border-kalahari/10">Timestamp</th>
                <th className="px-6 py-4 border-b border-kalahari/10">Action Event</th>
                <th className="px-6 py-4 border-b border-kalahari/10">Performed By</th>
                <th className="px-6 py-4 border-b border-kalahari/10">Target Asset / User ID</th>
                <th className="px-6 py-4 border-b border-kalahari/10">Changes / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kalahari/5">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center"><KuduLoader /></td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-olive/50 font-bold flex flex-col items-center justify-center">
                    <History className="h-8 w-8 mb-3 opacity-20" />
                    No audit records match your search criteria.
                  </td>
                </tr>
              ) : filteredLogs.map((log) => {
                // Dynamically extract any field that isn't a standard log property
                const standardKeys = ['id', 'action', 'performedBy', 'targetUid', 'timestamp'];
                const metadataEntries = Object.entries(log).filter(([key]) => !standardKeys.includes(key));

                return (
                  <tr key={log.id} className="hover:bg-kalahari/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-olive dark:text-off-white">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] font-medium text-olive/50">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-kalahari/10 text-kalahari">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-olive dark:text-off-white">{log.performedBy}</p>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs font-mono bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded text-olive/70 dark:text-off-white/70">
                        {log.targetUid || "N/A"}
                      </code>
                    </td>
                    <td className="px-6 py-4 flex flex-wrap gap-2 items-center min-w-[200px]">
                      {metadataEntries.length > 0 ? metadataEntries.map(([key, value]) => (
                        <span key={key} className="text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-olive dark:text-off-white px-2.5 py-1 rounded-md border border-kalahari/10">
                          <span className="opacity-50 uppercase tracking-widest mr-1.5">{key}:</span>
                          {String(value)}
                        </span>
                      )) : (
                        <span className="text-xs text-olive/30 italic">No extra metadata</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}