"use client";

import { useState, useEffect } from "react";
// Added updateAdminRole to the imports
import { getAdminMarketplaceStats, getAdmins, createAdmin, updateAdminRole } from "@/app/actions/admins";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client"; 
import { Shield, DollarSign, Search, ExternalLink, Activity, History, AlertTriangle, ChevronRight, X, Mail, UserPlus, Lock, Loader2, User, UserMinus, Ban, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import KuduLoader from "@/components/ui/KuduLoader";

export default function AdminTeamDashboard() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);

  // Current User State for Failsafe
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // New Admin Form State
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // Revoke & Role State
  const [isRevoking, setIsRevoking] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [actionMessage, setActionMessage] = useState({ text: "", type: "" });

  const loadData = async () => {
    setLoading(true);
    
    // Set current user details for permissions
    const user = auth.currentUser;
    if (user) {
      setCurrentUserEmail(user.email);
    }

    const [sRes, aRes] = await Promise.all([
      getAdminMarketplaceStats(),
      getAdmins()
    ]);
    
    if (sRes.success) setStats(sRes.stats);
    if (aRes && aRes.success) {
      const fetchedAdmins = aRes.data || [];
      setAdmins(fetchedAdmins);
      
      // Find current user's role from the fetched list
      if (user) {
        const me = fetchedAdmins.find((a: any) => a.email === user.email);
        if (me) setCurrentUserRole(me.role);
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- CREATE NEW ADMIN (SERVER-SIDE BYPASS) ---
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminPassword || !newAdminName) return;
    
    setIsCreating(true);
    setActionMessage({ text: "", type: "" });

    try {
      const formData = new FormData();
      formData.append("name", newAdminName.trim());
      formData.append("email", newAdminEmail.trim());
      formData.append("password", newAdminPassword);
      formData.append("role", "ADMIN");

      const response = await createAdmin(formData);

      if (response.success) {
        setActionMessage({ text: "Success! Account created.", type: "success" });
        setNewAdminName("");
        setNewAdminEmail("");
        setNewAdminPassword("");
        await loadData();
        
        setTimeout(() => {
          setIsAddAdminOpen(false);
          setActionMessage({ text: "", type: "" });
        }, 2000);
      } else {
        setActionMessage({ text: response.error || "Failed to create account.", type: "error" });
      }

    } catch (error: any) {
      console.error("Error creating staff:", error);
      setActionMessage({ text: "Server connection failed.", type: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  // --- UPDATE ROLE (PROMOTE / DEMOTE) ---
  const handleUpdateRole = async (adminId: string, adminEmail: string, newRole: string) => {
    if (adminEmail === currentUserEmail) {
      alert("Failsafe Triggered: You cannot alter your own role.");
      return;
    }

    const actionText = newRole === "SUPER_ADMIN" ? "promote" : "demote";
    if (!confirm(`Are you sure you want to ${actionText} ${adminEmail} to ${newRole}?`)) {
      return;
    }

    try {
      setIsUpdatingRole(true);
      const response = await updateAdminRole(adminId, newRole);

      if (response && response.success) {
        await loadData();
        setSelectedAdmin({ ...selectedAdmin, role: newRole }); // Optimistic UI update
      } else {
        alert(response?.error || "Failed to update role. Check server logs.");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("System error updating role.");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // --- REVOKE ADMIN ACCESS ---
  const handleRevokeAccess = async (adminId: string, adminEmail: string) => {
    if (adminEmail === currentUserEmail) {
      alert("Failsafe Triggered: You cannot revoke your own access.");
      return;
    }

    if (!confirm(`Are you absolutely sure you want to revoke access for ${adminEmail}? They will immediately be locked out.`)) {
      return;
    }

    try {
      setIsRevoking(true);
      await updateDoc(doc(db, "users", adminId), {
        isActive: false,
        role: "REVOKED",
        revokedAt: new Date().toISOString(),
        revokedBy: currentUserEmail || "System"
      });

      await loadData();
      setSelectedAdmin(null); 

    } catch (error) {
      console.error("Error revoking access:", error);
      alert("Failed to revoke access. Check console.");
    } finally {
      setIsRevoking(false);
    }
  };

  const filteredAdmins = admins.filter(item => 
    (item.name || item.companyName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 flex-1 flex flex-col h-full overflow-y-auto w-full relative">
      
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
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-olive/30" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-off-white dark:bg-stone-950 border border-kalahari/10 rounded-full text-sm font-bold focus:ring-2 focus:ring-kalahari transition-all outline-none text-olive dark:text-off-white" 
                placeholder="Search staff..." 
              />
            </div>
            
            {/* Only SUPER_ADMIN can see the add button */}
            {currentUserRole === "SUPER_ADMIN" && (
              <Button 
                onClick={() => setIsAddAdminOpen(true)}
                className="bg-kalahari hover:bg-kalahari/90 text-white rounded-full font-black px-6 shadow-md transition-all shrink-0"
              >
                <UserPlus className="h-4 w-4 mr-2" /> Add Admin
              </Button>
            )}
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
              ) : filteredAdmins.map(admin => {
                const isRevoked = admin.role === "REVOKED" || admin.isActive === false;
                
                return (
                  <tr 
                    key={admin.id} 
                    className={`transition-colors group cursor-pointer ${isRevoked ? "bg-red-50/30 dark:bg-red-950/20 hover:bg-red-50/50" : "hover:bg-kalahari/5"}`} 
                    onClick={() => setSelectedAdmin(admin)}
                  >
                    <td className="px-8 py-5">
                      <p className={`font-black flex items-center gap-2 ${isRevoked ? "text-red-900/50 dark:text-red-100/50" : "text-olive dark:text-off-white"}`}>
                        {admin.name || "Unknown"}
                        {isRevoked && <Ban className="h-3 w-3 text-red-500" />}
                      </p>
                      <p className={`text-xs font-medium ${isRevoked ? "text-red-900/40" : "text-olive/50"}`}>{admin.email}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`flex items-center gap-1.5 font-bold text-xs uppercase ${isRevoked ? "text-red-500" : "text-kalahari"}`}>
                        {isRevoked ? <Ban className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />} 
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Button variant="ghost" className={`opacity-0 group-hover:opacity-100 transition-opacity ${isRevoked ? "text-red-500" : "text-olive dark:text-off-white"}`}>
                        Inspect <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLIDE-OUT ADD ADMIN PANEL */}
      {isAddAdminOpen && (
        <div className="absolute inset-y-0 right-0 w-full lg:w-[450px] bg-white dark:bg-stone-900 shadow-[-20px_0_50px_rgba(0,0,0,0.2)] z-50 animate-in slide-in-from-right duration-300 border-l-4 border-kalahari overflow-y-auto">
          <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-olive dark:text-off-white uppercase flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-kalahari" /> New Admin
              </h3>
              <button onClick={() => setIsAddAdminOpen(false)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-olive dark:text-off-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <p className="text-sm font-medium text-olive/60 dark:text-off-white/60 mb-6">
              Create a secure account for a new team member. They can log in immediately with these credentials.
            </p>

            <form onSubmit={handleCreateAdmin} className="space-y-4 flex-1">
              {actionMessage.text && (
                <div className={`p-3 rounded-xl text-xs font-bold border ${
                  actionMessage.type === "error" 
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200" 
                    : "bg-green-50 dark:bg-green-900/20 text-green-700 border-green-200"
                }`}>
                  {actionMessage.text}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-olive/50">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input 
                      type="text" required value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} disabled={isCreating}
                      className="w-full pl-10 pr-4 py-3 bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-olive/50">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input 
                      type="email" required value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} disabled={isCreating}
                      className="w-full pl-10 pr-4 py-3 bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white"
                      placeholder="john@only-hunts.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-olive/50">Initial Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input 
                      type="text" required minLength={6} value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} disabled={isCreating}
                      className="w-full pl-10 pr-4 py-3 bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white"
                      placeholder="Set secure password"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={isCreating || !newAdminEmail || !newAdminPassword || !newAdminName} 
                  className="w-full h-12 bg-kalahari hover:bg-kalahari/90 text-white font-black rounded-xl shadow-lg transition-all"
                >
                  {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save & Create Admin"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SLIDE-OUT DOSSIER (STAFF PANEL) */}
      {selectedAdmin && !isAddAdminOpen && (
        <div className={`absolute inset-y-0 right-0 w-full lg:w-[450px] bg-white dark:bg-stone-900 shadow-[-20px_0_50px_rgba(0,0,0,0.2)] z-50 animate-in slide-in-from-right duration-300 border-l-4 overflow-y-auto flex flex-col ${selectedAdmin.role === "REVOKED" ? "border-red-500" : "border-kalahari"}`}>
          <div className="p-8 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-black ${selectedAdmin.role === "REVOKED" ? "bg-red-100 text-red-500" : "bg-kalahari/10 text-kalahari"}`}>
                {(selectedAdmin.name || "?").charAt(0)}
              </div>
              <button onClick={() => setSelectedAdmin(null)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-olive dark:text-off-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <h3 className="text-2xl font-black text-olive dark:text-off-white leading-tight mb-2">
              {selectedAdmin.name || "Unknown Admin"}
            </h3>
            <p className={`font-bold text-sm mb-6 flex items-center gap-2 ${selectedAdmin.role === "REVOKED" ? "text-red-500" : "text-kalahari"}`}>
               <Mail className="h-4 w-4" /> {selectedAdmin.email}
            </p>

            <div className="space-y-4 flex-1">
              <DossierItem icon={History} label="Account Created" value={selectedAdmin.createdAt ? new Date(selectedAdmin.createdAt).toLocaleDateString() : "Unknown"} />
              <DossierItem 
                icon={ExternalLink} 
                label="System Role" 
                value={selectedAdmin.role} 
                textColor={selectedAdmin.role === "REVOKED" ? "text-red-500" : undefined}
              />
              {selectedAdmin.role === "REVOKED" && selectedAdmin.revokedAt && (
                <DossierItem icon={Ban} label="Revoked On" value={new Date(selectedAdmin.revokedAt).toLocaleDateString()} textColor="text-red-500" />
              )}
            </div>

            {/* MANAGEMENT CONTROLS - Only show if current user is SUPER_ADMIN and selected is not current user */}
            {currentUserRole === "SUPER_ADMIN" && selectedAdmin.email !== currentUserEmail && selectedAdmin.role !== "REVOKED" && (
              <div className="pt-8 mt-8 border-t border-kalahari/10 space-y-4">
                
                {/* Promote / Demote Buttons */}
                {selectedAdmin.role === "ADMIN" ? (
                  <Button 
                    onClick={() => handleUpdateRole(selectedAdmin.id, selectedAdmin.email, "SUPER_ADMIN")}
                    disabled={isUpdatingRole}
                    className="w-full h-12 bg-white dark:bg-stone-900 border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-black rounded-xl transition-all"
                  >
                    {isUpdatingRole ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ArrowUpCircle className="h-4 w-4 mr-2" /> Promote to Super Admin</>}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleUpdateRole(selectedAdmin.id, selectedAdmin.email, "ADMIN")}
                    disabled={isUpdatingRole}
                    className="w-full h-12 bg-white dark:bg-stone-900 border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-black rounded-xl transition-all"
                  >
                    {isUpdatingRole ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ArrowDownCircle className="h-4 w-4 mr-2" /> Demote to Standard Admin</>}
                  </Button>
                )}

                {/* Revoke Access Button */}
                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100 dark:border-red-900 mb-4 mt-8">
                  <p className="text-xs font-bold text-red-800 dark:text-red-400 flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4" /> Danger Zone
                  </p>
                  <p className="text-[10px] text-red-600/80 dark:text-red-400/80 leading-relaxed">
                    Revoking access immediately blocks this user from logging in.
                  </p>
                </div>
                <Button 
                  onClick={() => handleRevokeAccess(selectedAdmin.id, selectedAdmin.email)}
                  disabled={isRevoking}
                  className="w-full h-12 bg-white dark:bg-stone-900 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-black rounded-xl transition-all"
                >
                  {isRevoking ? <Loader2 className="h-5 w-5 animate-spin" /> : <><UserMinus className="h-4 w-4 mr-2" /> Revoke Access</>}
                </Button>
              </div>
            )}
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

function DossierItem({ icon: Icon, label, value, textColor }: any) {
  return (
    <div className="flex items-center gap-3 p-4 bg-off-white dark:bg-stone-950 rounded-xl border border-kalahari/10">
      <Icon className={`h-5 w-5 ${textColor || "text-kalahari"}`} />
      <div>
        <p className="text-[10px] font-black uppercase text-olive/40 tracking-widest">{label}</p>
        <p className={`text-sm font-bold ${textColor || "text-olive dark:text-off-white"}`}>{value}</p>
      </div>
    </div>
  );
}