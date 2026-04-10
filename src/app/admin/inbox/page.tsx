"use client";

import { useState, useEffect } from "react";
import { Inbox, Search, AlertTriangle, ShieldAlert, Wrench, MessageSquare, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import KuduLoader from "@/components/ui/KuduLoader";

// Temporary mock type until we build the Firebase fetcher
type SupportTicket = {
  id: string;
  userId: string;
  userName: string;
  userRole: "HUNTER" | "OUTFITTER";
  category: "BOOKING_ISSUE" | "SAFETY_CONCERN" | "TECH_ISSUE";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
};

export default function AdminSupportInbox() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadTickets = async () => {
      setLoading(true);
      // TODO: Replace with actual `await getActiveSupportTickets()` from actions
      setTickets([]); 
      setLoading(false);
    };
    loadTickets();
  }, []);

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case "SAFETY_CONCERN": return { icon: ShieldAlert, color: "text-red-600 bg-red-100", label: "Safety Concern" };
      case "BOOKING_ISSUE": return { icon: AlertTriangle, color: "text-orange-600 bg-orange-100", label: "Booking Issue" };
      case "TECH_ISSUE": return { icon: Wrench, color: "text-blue-600 bg-blue-100", label: "Tech / Account" };
      default: return { icon: MessageSquare, color: "text-gray-600 bg-gray-100", label: "General" };
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 flex-1 flex flex-col h-full overflow-y-auto w-full">
      
      {/* INBOX METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <QuickStat icon={Inbox} label="Open Tickets" value={tickets.filter(t => t.status === "OPEN").length} color="bg-kalahari" />
        <QuickStat icon={ShieldAlert} label="Safety Escalations" value={tickets.filter(t => t.category === "SAFETY_CONCERN" && t.status !== "RESOLVED").length} color="bg-red-500" />
        <QuickStat icon={CheckCircle} label="Resolved (7 Days)" value="0" color="bg-green-500" />
      </div>

      {/* TICKETS TABLE */}
      <div className="bg-white dark:bg-stone-900 border-2 border-kalahari/20 rounded-3xl overflow-hidden shadow-xl flex-1 flex flex-col">
        <div className="p-6 border-b border-kalahari/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-black text-olive dark:text-off-white uppercase flex items-center gap-2">
            <Inbox className="h-6 w-6 text-kalahari" /> Support Triage
          </h2>
          
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-olive/30" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-off-white dark:bg-stone-950 border border-kalahari/10 rounded-full text-sm font-bold focus:ring-2 focus:ring-kalahari transition-all outline-none text-olive dark:text-off-white" 
              placeholder="Search tickets..." 
            />
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-kalahari/5 text-[10px] font-black uppercase tracking-widest text-olive/50 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-8 py-4 border-b border-kalahari/10">Date</th>
                <th className="px-8 py-4 border-b border-kalahari/10">User</th>
                <th className="px-8 py-4 border-b border-kalahari/10">Category</th>
                <th className="px-8 py-4 border-b border-kalahari/10">Status</th>
                <th className="px-8 py-4 border-b border-kalahari/10 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kalahari/5">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center"><KuduLoader /></td></tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-olive/50 font-bold">
                    <CheckCircle className="h-10 w-10 mx-auto text-kalahari/30 mb-3" />
                    Inbox Zero. No pending support requests.
                  </td>
                </tr>
              ) : (
                filteredTickets.map(ticket => {
                  const catConfig = getCategoryConfig(ticket.category);
                  const Icon = catConfig.icon;
                  return (
                    <tr key={ticket.id} className="hover:bg-kalahari/5 transition-colors group">
                      <td className="px-8 py-5 text-sm font-bold text-olive/70 dark:text-off-white/70">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-black text-olive dark:text-off-white">{ticket.userName}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-olive/40">{ticket.userRole}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit ${catConfig.color}`}>
                          <Icon className="h-3 w-3" /> {catConfig.label}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit ${
                          ticket.status === "OPEN" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          <Clock className="h-3 w-3" /> {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Button className="bg-kalahari hover:bg-kalahari/90 text-white font-bold text-xs uppercase tracking-widest">
                          Open Chat <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  )
                })
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