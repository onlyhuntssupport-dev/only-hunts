"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Megaphone, Plus, X, Trash2, ImageIcon, Loader2, CheckCircle, PauseCircle, MousePointerClick, Eye, Activity, DollarSign, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import KuduLoader from "@/components/ui/KuduLoader";
import { getAds, createAd, deleteAd, toggleAdStatus } from "@/app/actions/ads";
import { initializeAdPayment } from "@/app/actions/paystack"; // NEW: Import the payment gateway
import { auth } from "@/lib/firebase/client"; // NEW: For secure email engine authentication

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
  
  // Financial State
  const [newBillingAmount, setNewBillingAmount] = useState("");
  const [newBillingEmail, setNewBillingEmail] = useState("");
  const [newBillingCycle, setNewBillingCycle] = useState("1_MONTH");

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
    if (!newAdvertiser || !newBillingEmail || !newBillingAmount) return;
    
    setIsCreating(true);
    const formData = new FormData();
    formData.append("advertiserName", newAdvertiser.trim());
    formData.append("imageUrl", newImageUrl.trim());
    formData.append("targetUrl", newTargetUrl.trim());
    formData.append("placement", newPlacement);
    
    // Append Financial Data
    formData.append("billingAmount", newBillingAmount);
    formData.append("billingEmail", newBillingEmail.trim());
    formData.append("billingCycle", newBillingCycle);
    formData.append("paymentStatus", "PENDING_PAYMENT");
    formData.append("isActive", "false");

    const res = await createAd(formData);
    
    if (res.success) {
      // --- NEW: INVOICE GENERATION & EMAIL DISPATCH ---
      try {
        // Retrieve the newly created campaign ID from your server action
        const campaignId = res.data?.id || res.id; 
        
        if (campaignId) {
          const amountCentsZAR = parseInt(newBillingAmount) * 100;
          
          // 1. Ask Paystack for a secure payment link
          const payRes = await initializeAdPayment(
            newBillingEmail.trim(),
            newAdvertiser.trim(), // Storing brand name as the Sponsor ID
            campaignId,
            amountCentsZAR
          );

          // 2. Dispatch the email silently
          if (payRes.authorizationUrl && auth.currentUser) {
            const idToken = await auth.currentUser.getIdToken(true);
            
            await fetch("/api/email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`
              },
              body: JSON.stringify({
                to: newBillingEmail.trim(),
                subject: `Invoice: Activate your Campaign on Only-Hunts`,
                userName: newAdvertiser.trim(),
                title: "Your Ad Campaign is Ready!",
                message: `We have successfully staged your curated placement. Please complete your payment of ZAR ${parseInt(newBillingAmount).toLocaleString()} to instantly activate the campaign across the marketplace.`,
                ctaText: "Pay Secure Invoice",
                ctaLink: payRes.authorizationUrl, // The Paystack Link!
              }),
            });
          }
        }
      } catch (invoiceErr) {
        console.error("Failed to generate or email invoice:", invoiceErr);
        alert("Campaign staged, but the automated invoice email failed. You may need to send it manually.");
      }
      // --- END INVOICE GENERATION ---

      setNewAdvertiser("");
      setNewImageUrl("");
      setNewTargetUrl("");
      setNewPlacement("IN_FEED");
      setNewBillingAmount("");
      setNewBillingEmail("");
      setNewBillingCycle("1_MONTH");
      
      setIsAddOpen(false);
      await loadData();
      
      alert("Campaign staged successfully! The secure invoice has been dispatched to the sponsor.");
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

  const handleToggleStatus = async (id: string, currentStatus: boolean, paymentStatus: string) => {
    let forcePaid = false;
    
    // Failsafe: Prevent manual activation if unpaid
    if (!currentStatus && paymentStatus === "PENDING_PAYMENT") {
      if (!window.confirm("This campaign is marked as UNPAID. Are you sure you want to force it live anyway?")) {
        return;
      }
      forcePaid = true;
    }

    const res = await toggleAdStatus(id, currentStatus, forcePaid);
    if (res.success) {
      setAds(prev => prev.map(a => a.id === id ? { 
        ...a, 
        isActive: !currentStatus,
        paymentStatus: forcePaid ? "PAID" : a.paymentStatus 
      } : a));
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
                <th className="px-8 py-4 border-b border-kalahari/10">Placement & Financials</th>
                <th className="px-8 py-4 border-b border-kalahari/10">Performance</th>
                <th className="px-8 py-4 border-b border-kalahari/10">System Status</th>
                <th className="px-8 py-4 border-b border-kalahari/10 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kalahari/5">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center"><KuduLoader /></td></tr>
              ) : ads.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-olive/50 font-bold">No active campaigns.</td></tr>
              ) : ads.map(ad => {
                const isPaid = ad.paymentStatus === "PAID";
                const payColor = isPaid ? "text-green-600 bg-green-50 border-green-200" : "text-amber-600 bg-amber-50 border-amber-200";

                return (
                  <tr key={ad.id} className="hover:bg-kalahari/5 transition-colors group">
                    <td className="px-8 py-5 flex items-center gap-4">
                      <div className="h-12 w-20 relative bg-off-white dark:bg-black rounded-lg border border-kalahari/20 overflow-hidden flex items-center justify-center shrink-0">
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
                      <div className="flex flex-col gap-2 items-start">
                        <span className="bg-kalahari/10 text-kalahari border border-kalahari/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          {ad.placement.replace("_", " ")}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${payColor}`}>
                          {ad.paymentStatus?.replace("_", " ") || "UNKNOWN"}
                        </span>
                      </div>
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
                      <button onClick={() => handleToggleStatus(ad.id, ad.isActive, ad.paymentStatus)} className="focus:outline-none">
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
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Slide-out */}
      {isAddOpen && (
        <div className="absolute inset-y-0 right-0 w-full lg:w-[450px] bg-white dark:bg-stone-900 shadow-[-20px_0_50px_rgba(0,0,0,0.2)] z-50 animate-in slide-in-from-right duration-300 border-l-4 border-kalahari flex flex-col">
          <div className="p-8 h-full flex flex-col overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8 shrink-0">
              <h3 className="text-xl font-black text-olive dark:text-off-white uppercase flex items-center gap-2">
                <Plus className="h-6 w-6 text-kalahari" /> New Campaign
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-olive dark:text-off-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-8 flex-1">
              
              {/* Core Ad Details */}
              <div className="space-y-6">
                <h4 className="text-xs font-black text-kalahari uppercase tracking-widest border-b border-kalahari/20 pb-2">Creative Assets</h4>
                
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
              </div>

              {/* Financials Section */}
              <div className="space-y-6 bg-off-white dark:bg-stone-950 p-5 rounded-2xl border border-kalahari/20">
                <h4 className="text-xs font-black text-kalahari uppercase tracking-widest border-b border-kalahari/20 pb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Billing & Invoicing
                </h4>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-olive/50 flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> Sponsor Email (For Invoice)
                  </label>
                  <input type="email" required value={newBillingEmail} onChange={(e) => setNewBillingEmail(e.target.value)} disabled={isCreating} className="w-full px-4 py-3 bg-white dark:bg-stone-900 border border-kalahari/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white" placeholder="billing@sponsor.com" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-olive/50 flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3" /> Amount (ZAR)
                    </label>
                    <select required value={newBillingAmount} onChange={(e) => setNewBillingAmount(e.target.value)} disabled={isCreating} className="w-full px-4 py-3 bg-white dark:bg-stone-900 border border-kalahari/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white">
                      <option value="" disabled>Select amount...</option>
                      {Array.from({length: 40}, (_, i) => (i + 1) * 500).map(amount => (
                        <option key={amount} value={amount}>ZAR {amount.toLocaleString()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-olive/50 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> Cycle
                    </label>
                    <select value={newBillingCycle} onChange={(e) => setNewBillingCycle(e.target.value)} disabled={isCreating} className="w-full px-4 py-3 bg-white dark:bg-stone-900 border border-kalahari/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white">
                      <option value="1_MONTH">1 Month</option>
                      <option value="3_MONTHS">3 Months</option>
                      <option value="6_MONTHS">6 Months</option>
                      <option value="LIFETIME">Lifetime</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 shrink-0 pb-8">
                <Button type="submit" disabled={isCreating || !newAdvertiser || !newTargetUrl || !newBillingEmail || !newBillingAmount} className="w-full h-14 bg-kalahari hover:bg-kalahari/90 text-white font-black rounded-xl shadow-lg transition-all text-lg">
                  {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Stage Ad & Send Invoice"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}