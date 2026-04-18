"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Megaphone, Plus, X, Trash2, ImageIcon, Loader2, CheckCircle, PauseCircle, MousePointerClick, Eye, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import KuduLoader from "@/components/ui/KuduLoader";
import { getAds, createAd, deleteAd, toggleAdStatus } from "@/app/actions/ads";

export default function AdminAdsDashboard() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Slide-out State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [newAdvertiser, setNewAdvertiser] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newTargetUrl, setNewTargetUrl] = useState("");
  const [newPlacement, setNewPlacement] = useState("IN_FEED");

  const loadData = async () => {
    setLoading(true);
    const res = await getAds();
    if (res.success && res.data) {
      setAds(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdvertiser) return;
    
    setIsCreating(true);
    const formData = new FormData();
    formData.append("advertiserName", newAdvertiser.trim());
    formData.append("imageUrl", newImageUrl.trim());
    formData.append("targetUrl", newTargetUrl.trim());
    formData.append("placement", newPlacement);

    const res = await createAd(formData);
    if (res.success) {
      setNewAdvertiser("");
      setNewImageUrl("");
      setNewTargetUrl("");
      setNewPlacement("IN_FEED");
      setIsAddOpen(false);
      await loadData();
    } else {
      alert(res.error || "Failed to create campaign.");
    }
    setIsCreating(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the campaign for ${name}?`)) return;
    const res = await deleteAd(id);
    if (res.success) {
      setAds(prev => prev.filter(a => a.id !== id));
    } else {
      alert("Failed to delete.");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const res = await toggleAdStatus(id, currentStatus);
    if (res.success) {
      setAds(prev => prev.map(a => a.id === id ? { ...a, isActive: !currentStatus } : a));
    } else {
      alert("Failed to update status.");
    }
  };

  const calculateCTR = (clicks: number, impressions: number) => {
    if (!impressions || impressions === 0) return "0.00%";
    return ((clicks / impressions) * 100).toFixed(2) + "%";
  };

  return (
    <div className="p-4 sm:p-8 flex-1 flex flex-col h-full overflow-y-auto w-full relative">
      <div className="bg-white dark:bg-stone-900 border-2 border-kalahari/20 rounded-3xl overflow-hidden shadow-xl flex-1 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-kalahari/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-black text-olive dark:text-off-white uppercase flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-kalahari" /> Sponsored Campaigns
          </h2>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="bg-kalahari hover:bg-kalahari/90 text-white rounded-full font-black px-6 shadow-md transition-all shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" /> New Campaign
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-kalahari/5 text-[10px] font-black uppercase tracking-widest text-olive/50 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-8 py-4 border-b border-kalahari/10">Campaign / Sponsor</th>
                <th className="px-8 py-4 border-b border-kalahari/10">Placement</th>
                <th className="px-8 py-4 border-b border-kalahari/10">Performance</th>
                <th className="px-8 py-4 border-b border-kalahari/10">Status</th>
                <th className="px-8 py-4 border-b border-kalahari/10 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kalahari/5">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center"><KuduLoader /></td></tr>
              ) : ads.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-olive/50 font-bold">No active campaigns.</td></tr>
              ) : ads.map(ad => (
                <tr key={ad.id} className="hover:bg-kalahari/5 transition-colors group">
                  <td className="px-8 py-5 flex items-center gap-4">
                    <div className="h-12 w-20 relative bg-off-white dark:bg-black rounded-lg border border-kalahari/20 overflow-hidden flex items-center justify-center shrink-0">
                      {/* CRASH FIX: URL Validation */}
                      {(ad.imageUrl && (ad.imageUrl.startsWith('http') || ad.imageUrl.startsWith('/'))) ? (
                        <Image src={ad.imageUrl} alt={ad.advertiserName} fill className="object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-kalahari/50" />
                      )}
                    </div>
                    <div>
                      <p className="font-black text-olive dark:text-off-white">{ad.advertiserName}</p>
                      <p className="text-[10px] text-olive/40 font-bold truncate max-w-[200px]">{ad.targetUrl || "No Link Provided"}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="bg-kalahari/10 text-kalahari border border-kalahari/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      {ad.placement.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-olive/70 dark:text-off-white/70">
                        <Eye className="h-3 w-3 text-kalahari" /> {ad.impressions?.toLocaleString() || 0} Imp.
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-olive/70 dark:text-off-white/70">
                        <MousePointerClick className="h-3 w-3 text-kalahari" /> {ad.clicks?.toLocaleString() || 0} Clicks
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-orange-500 mt-1">
                        <Activity className="h-3 w-3" /> CTR: {calculateCTR(ad.clicks, ad.impressions)}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button onClick={() => handleToggleStatus(ad.id, ad.isActive)} className="focus:outline-none">
                      {ad.isActive ? (
                        <span className="text-green-600 flex items-center gap-1.5 font-bold text-xs uppercase hover:opacity-80"><CheckCircle className="h-3.5 w-3.5" /> Live</span>
                      ) : (
                        <span className="text-orange-500 flex items-center gap-1.5 font-bold text-xs uppercase hover:opacity-80"><PauseCircle className="h-3.5 w-3.5" /> Paused</span>
                      )}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => handleDelete(ad.id, ad.advertiserName)}
                      className="p-2 text-red-500 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors inline-flex shadow-sm border border-red-500/20"
                      title="Delete Campaign"
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
                <Plus className="h-6 w-6 text-kalahari" /> New Campaign
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-olive dark:text-off-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-6 flex-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-olive/50">Sponsor / Advertiser Name</label>
                <input type="text" required value={newAdvertiser} onChange={(e) => setNewAdvertiser(e.target.value)} disabled={isCreating} className="w-full px-4 py-3 bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white" placeholder="e.g. Safari Outdoor" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-olive/50">Banner Image URL</label>
                <input type="text" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} disabled={isCreating} className="w-full px-4 py-3 bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white" placeholder="https://..." />
                <p className="text-[10px] text-olive/40 mt-1">Recommended: 800x400px for In-Feed, 600x200px for Checkout.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-olive/50">Target Destination URL</label>
                <input type="text" required value={newTargetUrl} onChange={(e) => setNewTargetUrl(e.target.value)} disabled={isCreating} className="w-full px-4 py-3 bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white" placeholder="https://..." />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-olive/50">Ad Placement</label>
                <select value={newPlacement} onChange={(e) => setNewPlacement(e.target.value)} disabled={isCreating} className="w-full px-4 py-3 bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white">
                  <option value="IN_FEED">Marketplace In-Feed (Scroll)</option>
                  <option value="CHECKOUT">Post-Quote Checkout Success</option>
                  <option value="SEARCH_TOP">Top of Search Results</option>
                </select>
              </div>

              <div className="pt-6">
                <Button type="submit" disabled={isCreating || !newAdvertiser || !newTargetUrl} className="w-full h-12 bg-kalahari hover:bg-kalahari/90 text-white font-black rounded-xl shadow-lg transition-all">
                  {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Launch Campaign"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}