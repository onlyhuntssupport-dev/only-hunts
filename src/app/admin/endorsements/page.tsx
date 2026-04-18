"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Award, Plus, X, Trash2, Globe, Image as ImageIcon, Loader2, CheckCircle, PauseCircle, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import KuduLoader from "@/components/ui/KuduLoader";
import { getEndorsements, createEndorsement, deleteEndorsement, toggleEndorsementStatus } from "@/app/actions/endorsements";

export default function AdminEndorsementsDashboard() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Slide-out State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [newName, setNewName] = useState("");
  const [newLogoUrl, setNewLogoUrl] = useState("");
  const [newWebsiteUrl, setNewWebsiteUrl] = useState("");
  const [newType, setNewType] = useState("PARTNER");

  const loadData = async () => {
    setLoading(true);
    const res = await getEndorsements();
    if (res.success && res.data) {
      setPartners(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    
    setIsCreating(true);
    const formData = new FormData();
    formData.append("name", newName.trim());
    formData.append("logoUrl", newLogoUrl.trim());
    formData.append("websiteUrl", newWebsiteUrl.trim());
    formData.append("type", newType);
    formData.append("order", partners.length.toString());

    const res = await createEndorsement(formData);
    if (res.success) {
      setNewName("");
      setNewLogoUrl("");
      setNewWebsiteUrl("");
      setIsAddOpen(false);
      await loadData();
    } else {
      alert(res.error || "Failed to add partner.");
    }
    setIsCreating(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove the endorsement for ${name}?`)) return;
    const res = await deleteEndorsement(id);
    if (res.success) {
      setPartners(prev => prev.filter(p => p.id !== id));
    } else {
      alert("Failed to delete.");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const res = await toggleEndorsementStatus(id, currentStatus);
    if (res.success) {
      setPartners(prev => prev.map(p => p.id === id ? { ...p, isActive: !currentStatus } : p));
    } else {
      alert("Failed to update status.");
    }
  };

  return (
    <div className="p-4 sm:p-8 flex-1 flex flex-col h-full overflow-y-auto w-full relative">
      <div className="bg-white dark:bg-stone-900 border-2 border-kalahari/20 rounded-3xl overflow-hidden shadow-xl flex-1 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-kalahari/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-black text-olive dark:text-off-white uppercase flex items-center gap-2">
            <Award className="h-6 w-6 text-kalahari" /> Brand Endorsements
          </h2>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="bg-kalahari hover:bg-kalahari/90 text-white rounded-full font-black px-6 shadow-md transition-all shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Partner
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-kalahari/5 text-[10px] font-black uppercase tracking-widest text-olive/50 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-8 py-4 border-b border-kalahari/10">Brand / Organization</th>
                <th className="px-8 py-4 border-b border-kalahari/10">Category</th>
                <th className="px-8 py-4 border-b border-kalahari/10">Visibility</th>
                <th className="px-8 py-4 border-b border-kalahari/10 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kalahari/5">
              {loading ? (
                <tr><td colSpan={4} className="py-20 text-center"><KuduLoader /></td></tr>
              ) : partners.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center text-olive/50 font-bold">No endorsements added yet.</td></tr>
              ) : partners.map(partner => (
                <tr key={partner.id} className="hover:bg-kalahari/5 transition-colors group">
                  <td className="px-8 py-5 flex items-center gap-4">
                    <div className="h-12 w-24 relative bg-off-white dark:bg-black rounded-lg border border-kalahari/20 overflow-hidden flex items-center justify-center">
                      {partner.logoUrl ? (
                        <Image src={partner.logoUrl} alt={partner.name} fill className="object-contain p-2" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-kalahari/50" />
                      )}
                    </div>
                    <div>
                      <p className="font-black text-olive dark:text-off-white">{partner.name}</p>
                      {partner.websiteUrl && (
                        <a href={partner.websiteUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-kalahari hover:underline flex items-center mt-1">
                          <LinkIcon className="h-3 w-3 mr-1" /> Visit Site
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="bg-kalahari/10 text-kalahari border border-kalahari/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      {partner.type}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <button onClick={() => handleToggleStatus(partner.id, partner.isActive)} className="focus:outline-none">
                      {partner.isActive ? (
                        <span className="text-green-600 flex items-center gap-1.5 font-bold text-xs uppercase hover:opacity-80"><CheckCircle className="h-3.5 w-3.5" /> Active</span>
                      ) : (
                        <span className="text-orange-500 flex items-center gap-1.5 font-bold text-xs uppercase hover:opacity-80"><PauseCircle className="h-3.5 w-3.5" /> Hidden</span>
                      )}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    {/* FIXED: Removed opacity-0 so the delete button is always visible */}
                    <button 
                      onClick={() => handleDelete(partner.id, partner.name)}
                      className="p-2 text-red-500 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors inline-flex"
                      title="Remove Partner"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Slide-out */}
      {isAddOpen && (
        <div className="absolute inset-y-0 right-0 w-full lg:w-[450px] bg-white dark:bg-stone-900 shadow-[-20px_0_50px_rgba(0,0,0,0.2)] z-50 animate-in slide-in-from-right duration-300 border-l-4 border-kalahari flex flex-col">
          <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-olive dark:text-off-white uppercase flex items-center gap-2">
                <Plus className="h-6 w-6 text-kalahari" /> New Endorsement
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-olive dark:text-off-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-6 flex-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-olive/50">Brand Name</label>
                <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} disabled={isCreating} className="w-full px-4 py-3 bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white" placeholder="e.g. Test Partner 1" />
              </div>

              <div className="space-y-1.5">
                {/* FIXED: Changed type to text to prevent strict browser URL validation */}
                <label className="text-[10px] font-black uppercase tracking-widest text-olive/50">Logo Image URL (Optional)</label>
                <input type="text" value={newLogoUrl} onChange={(e) => setNewLogoUrl(e.target.value)} disabled={isCreating} className="w-full px-4 py-3 bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white" placeholder="https://..." />
                <p className="text-[10px] text-olive/40 mt-1">Leave blank to use a secure text placeholder.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-olive/50">Website URL (Optional)</label>
                <input type="text" value={newWebsiteUrl} onChange={(e) => setNewWebsiteUrl(e.target.value)} disabled={isCreating} className="w-full px-4 py-3 bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white" placeholder="https://..." />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-olive/50">Category</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value)} disabled={isCreating} className="w-full px-4 py-3 bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white">
                  <option value="PARTNER">Brand Partner</option>
                  <option value="CONSERVATION">Conservation Group</option>
                  <option value="AFFILIATE">Industry Affiliate</option>
                </select>
              </div>

              <div className="pt-6">
                <Button type="submit" disabled={isCreating || !newName} className="w-full h-12 bg-kalahari hover:bg-kalahari/90 text-white font-black rounded-xl shadow-lg transition-all">
                  {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Endorsement"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}