"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/client";
// FIX: Added updateDoc and doc imports
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { getGlobalEntities, getEntityActivity, verifyOutfitter, suspendUser, reinstateUser } from "@/app/actions/admins";
import { Store, Search, ExternalLink, CheckCircle, Activity, History, AlertTriangle, ChevronRight, X, Mail, Database, Loader2, Package, FileText, FileQuestion, PauseCircle, PlayCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import KuduLoader from "@/components/ui/KuduLoader";

export default function AdminOutfittersDashboard() {
  const router = useRouter();
  const [outfitters, setOutfitters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [entityActivity, setEntityActivity] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await getGlobalEntities("outfitter");
      if (res && res.success) setOutfitters(res.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const handleInspectData = async () => {
    if (!selectedEntity) return;
    setIsInspecting(true);
    setEntityActivity(null);
    const res = await getEntityActivity(selectedEntity.id, selectedEntity.role);
    if (res.success) setEntityActivity(res.data);
    else alert("Failed to pull platform records.");
    setIsInspecting(false);
  };

  const handleVerify = async () => {
    if (!selectedEntity) return;
    setIsVerifying(true);
    const res = await verifyOutfitter(selectedEntity.id);
    if (res.success) {
      setOutfitters(outfitters.map(e => e.id === selectedEntity.id ? { ...e, status: "VERIFIED" } : e));
      setSelectedEntity({ ...selectedEntity, status: "VERIFIED" });
    } else {
      alert("Failed to verify user: " + res.error);
    }
    setIsVerifying(false);
  };

  const handleSuspendToggle = async () => {
    if (!selectedEntity) return;
    const isCurrentlySuspended = selectedEntity.status === "SUSPENDED";
    const confirmMsg = isCurrentlySuspended 
      ? "Are you sure you want to reinstate this outfitter?" 
      : "Are you sure you want to suspend this outfitter? Their hunts will be hidden.";
      
    if (!window.confirm(confirmMsg)) return;

    setIsSuspending(true);
    const res = isCurrentlySuspended 
      ? await reinstateUser(selectedEntity.id)
      : await suspendUser(selectedEntity.id);
    
    if (res.success) {
      const newStatus = isCurrentlySuspended ? "VERIFIED" : "SUSPENDED";
      setOutfitters(outfitters.map(e => e.id === selectedEntity.id ? { ...e, status: newStatus } : e));
      setSelectedEntity({ ...selectedEntity, status: newStatus });
    } else {
      alert(`Failed to ${isCurrentlySuspended ? 'reinstate' : 'suspend'} user: ` + res.error);
    }
    setIsSuspending(false);
  };

  const handleOpenDirectMessage = async () => {
    if (!auth.currentUser || !selectedEntity) {
      alert("Authentication error. Please refresh the page.");
      return;
    }

    setIsMessaging(true);

    try {
      const adminId = auth.currentUser.uid;
      const outfitterId = selectedEntity.id;
      const chatsRef = collection(db, "chats");

      const q = query(chatsRef, where("participants", "array-contains", adminId));
      const querySnapshot = await getDocs(q);

      let existingChatId: string | null = null;
      querySnapshot.forEach((document) => {
        const data = document.data();
        if (data.participants && data.participants.includes(outfitterId)) {
          existingChatId = document.id;
        }
      });

      let chatIdToRoute = existingChatId;

      if (!chatIdToRoute) {
        const newChatRef = await addDoc(chatsRef, {
          participants: [adminId, outfitterId],
          type: "ADMIN_SUPPORT",
          outfitterName: selectedEntity.companyName || selectedEntity.name || "Outfitter",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: "Secure admin thread initialized.",
          unreadCount: {
            [outfitterId]: 1,
            [adminId]: 0
          }
        });
        chatIdToRoute = newChatRef.id;
      } else {
        // FIX: Self-heal old test chats by injecting the missing name
        await updateDoc(doc(db, "chats", chatIdToRoute), {
          outfitterName: selectedEntity.companyName || selectedEntity.name || "Outfitter",
          type: "ADMIN_SUPPORT"
        });
      }

      router.push(`/messages/${chatIdToRoute}`); 

    } catch (error) {
      console.error("Chat initialization error:", error);
      alert("Failed to initialize secure chat. Please check console.");
    } finally {
      setIsMessaging(false);
    }
  };

  const filtered = outfitters.filter(item => 
    (item.companyName || item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 flex-1 flex flex-col h-full overflow-y-auto w-full relative">
      <div className="bg-white dark:bg-stone-900 border-2 border-kalahari/20 rounded-3xl overflow-hidden shadow-xl flex-1 flex flex-col">
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

        <div className="overflow-auto flex-1">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-kalahari/5 text-[10px] font-black uppercase tracking-widest text-olive/50 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-8 py-4 border-b border-kalahari/10">Company / Name</th>
                <th className="px-8 py-4 border-b border-kalahari/10">Status</th>
                <th className="px-8 py-4 border-b border-kalahari/10 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kalahari/5">
              {loading ? (
                <tr><td colSpan={3} className="py-20 text-center"><KuduLoader /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={3} className="py-20 text-center text-olive/50 font-bold">No outfitters found.</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="hover:bg-kalahari/5 transition-colors group cursor-pointer" onClick={() => { setSelectedEntity(e); setEntityActivity(null); }}>
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
                      Inspect <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GOD PANEL DOSSIER */}
      {selectedEntity && (
        <div className="absolute inset-y-0 right-0 w-full lg:w-[450px] bg-white dark:bg-stone-900 shadow-[-20px_0_50px_rgba(0,0,0,0.2)] z-50 animate-in slide-in-from-right duration-300 border-l-4 border-kalahari overflow-y-auto">
          <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div className="h-16 w-16 bg-kalahari/10 rounded-2xl flex items-center justify-center text-kalahari text-2xl font-black">
                {(selectedEntity.companyName || selectedEntity.name || "?").charAt(0)}
              </div>
              <button onClick={() => setSelectedEntity(null)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-olive dark:text-off-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <h3 className="text-2xl font-black text-olive dark:text-off-white leading-tight mb-2">
              {selectedEntity.companyName || selectedEntity.name || "Unknown"}
            </h3>
            <p className="text-kalahari font-bold text-sm mb-6 flex items-center gap-2">
               <Mail className="h-4 w-4" /> {selectedEntity.email}
            </p>

            <div className="space-y-4 flex-1">
              <DossierItem icon={History} label="Account Created" value={selectedEntity.createdAt ? new Date(selectedEntity.createdAt).toLocaleDateString() : "Unknown"} />
              <DossierItem icon={ExternalLink} label="System Role" value="OUTFITTER" />
              
              <div className="pt-8 border-t border-kalahari/10 space-y-3">
                <label className="text-[10px] font-black uppercase text-olive/40 tracking-widest">Admin Critical Actions</label>
                
                <button 
                  onClick={handleOpenDirectMessage} 
                  disabled={isMessaging} 
                  className="w-full flex items-center justify-center gap-3 p-4 bg-kalahari text-white rounded-xl font-black hover:bg-kalahari/90 transition-all shadow-md disabled:opacity-50 mb-2"
                >
                  {isMessaging ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />} 
                  {isMessaging ? "Initializing Secure Chat..." : "Open Direct Message"}
                </button>

                <button onClick={handleInspectData} disabled={isInspecting} className="w-full flex items-center justify-center gap-3 p-4 bg-olive text-white rounded-xl font-black hover:bg-olive/90 transition-all disabled:opacity-50">
                  {isInspecting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Database className="h-5 w-5 text-kalahari" />} 
                  {isInspecting ? "Pulling Records..." : "Inspect Public Records"}
                </button>

                {entityActivity && (
                  <div className="mt-4 p-4 bg-off-white dark:bg-stone-950 rounded-xl border border-kalahari/20 text-sm animate-in fade-in zoom-in-95 duration-200">
                    <p className="font-bold text-olive dark:text-white mb-2 flex items-center justify-between">
                      <span><Package className="h-4 w-4 inline mr-1 text-kalahari"/> Active Packages:</span> 
                      <span className="bg-kalahari/20 text-kalahari px-2 py-0.5 rounded-full">{entityActivity.activePackages}</span>
                    </p>
                    <p className="font-bold text-olive dark:text-white mb-4 flex items-center justify-between">
                      <span><Activity className="h-4 w-4 inline mr-1 text-kalahari"/> Total Quotes Sent:</span> 
                      <span className="bg-kalahari/20 text-kalahari px-2 py-0.5 rounded-full">{entityActivity.totalLeads}</span>
                    </p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-kalahari/10 space-y-4">
                  {(selectedEntity.permitUrl || selectedEntity.verificationDocUrl || selectedEntity.documentUrl) ? (
                    <a href={selectedEntity.permitUrl || selectedEntity.verificationDocUrl || selectedEntity.documentUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-3 p-4 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl font-black hover:bg-blue-100 transition-all border border-blue-200">
                      <FileText className="h-5 w-5" /> View Uploaded Permit
                    </a>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-3 p-4 bg-gray-50 text-gray-400 rounded-xl font-black border border-gray-200 cursor-not-allowed">
                      <FileQuestion className="h-5 w-5" /> No Permit Uploaded
                    </div>
                  )}

                  <button onClick={handleVerify} disabled={isVerifying || selectedEntity.status === "VERIFIED"} className="w-full flex items-center justify-center gap-3 p-4 bg-kalahari/10 text-kalahari rounded-xl font-black hover:bg-kalahari/20 transition-all border border-kalahari/20 disabled:opacity-50">
                    {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />} 
                    {selectedEntity.status === "VERIFIED" ? "Identity Verified" : "Verify Identity"}
                  </button>

                  <button onClick={handleSuspendToggle} disabled={isSuspending} className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl font-black transition-all border disabled:opacity-50 ${selectedEntity.status === "SUSPENDED" ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100" : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"}`}>
                    {isSuspending ? <Loader2 className="h-5 w-5 animate-spin" /> : selectedEntity.status === "SUSPENDED" ? <PlayCircle className="h-5 w-5" /> : <PauseCircle className="h-5 w-5" />} 
                    {selectedEntity.status === "SUSPENDED" ? "Reinstate Account" : "Suspend Account"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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