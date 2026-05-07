"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { getOutfitterById, getEntityActivity, verifyOutfitter, suspendUser, reinstateUser, nukeOutfitter, updateOutfitterFinancials } from "@/app/actions/admins";
import { ArrowLeft, CheckCircle, Activity, History, ExternalLink, Mail, Database, Loader2, Package, FileText, FileQuestion, PauseCircle, PlayCircle, MessageSquare, Trash2, Phone, DollarSign, Calendar, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import KuduLoader from "@/components/ui/KuduLoader";

export default function OutfitterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [entity, setEntity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [entityActivity, setEntityActivity] = useState<any>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);
  const [isNuking, setIsNuking] = useState(false); 

  // Financial Override State
  const [promoCommission, setPromoCommission] = useState("");
  const [promoSubscription, setPromoSubscription] = useState("");
  const [promoExpiry, setPromoExpiry] = useState("");
  const [isUpdatingFinancials, setIsUpdatingFinancials] = useState(false);

  useEffect(() => {
    const fetchOutfitter = async () => {
      if (!id) return;
      setLoading(true);
      const res = await getOutfitterById(id);
      if (res.success && res.data) {
        setEntity(res.data);
        
        // Pre-fill financial state
        setPromoCommission(res.data.promoCommissionRate !== undefined && res.data.promoCommissionRate !== null ? res.data.promoCommissionRate.toString() : "");
        setPromoSubscription(res.data.promoSubscriptionRate !== undefined && res.data.promoSubscriptionRate !== null ? res.data.promoSubscriptionRate.toString() : "");
        if (res.data.promoExpiresAt) {
          setPromoExpiry(new Date(res.data.promoExpiresAt).toISOString().split('T')[0]);
        }
      } else {
        alert("Failed to load outfitter details.");
        router.push('/admin/outfitters');
      }
      setLoading(false);
    };

    fetchOutfitter();
  }, [id, router]);

  const handleSaveFinancials = async () => {
    setIsUpdatingFinancials(true);
    const payload = {
      // If empty string, pass null to revert to platform defaults
      promoCommissionRate: promoCommission !== "" ? Number(promoCommission) : null,
      promoSubscriptionRate: promoSubscription !== "" ? Number(promoSubscription) : null,
      promoExpiresAt: promoExpiry ? new Date(promoExpiry).toISOString() : null
    };

    const res = await updateOutfitterFinancials(id, payload);
    if (res.success) {
      setEntity({ ...entity, ...payload });
      alert("Financial overrides locked in successfully.");
    } else {
      alert("Failed to update financials: " + res.error);
    }
    setIsUpdatingFinancials(false);
  };

  const handleExpirationOverride = (val: string) => {
    if (val === "clear") {
      setPromoExpiry("");
      return;
    }
    if (val === "lifetime") {
      const lifetimeDate = new Date();
      lifetimeDate.setFullYear(lifetimeDate.getFullYear() + 100);
      setPromoExpiry(lifetimeDate.toISOString().split('T')[0]);
      return;
    }

    const newDate = new Date();
    newDate.setMonth(newDate.getMonth() + parseInt(val));
    setPromoExpiry(newDate.toISOString().split('T')[0]);
  };

  const handleInspectData = async () => {
    setIsInspecting(true);
    setEntityActivity(null);
    const res = await getEntityActivity(id, "OUTFITTER");
    if (res.success) setEntityActivity(res.data);
    else alert("Failed to pull platform records.");
    setIsInspecting(false);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    const adminEmail = auth.currentUser?.email || "Unknown Admin";
    const res = await verifyOutfitter(id, adminEmail);
    if (res.success) {
      setEntity({ ...entity, status: "VERIFIED" });
    } else {
      alert("Failed to verify user: " + res.error);
    }
    setIsVerifying(false);
  };

  const handleSuspendToggle = async () => {
    const isCurrentlySuspended = entity.status === "SUSPENDED";
    const confirmMsg = isCurrentlySuspended 
      ? "Are you sure you want to reinstate this outfitter?" 
      : "Are you sure you want to suspend this outfitter? Their hunts will be hidden.";
      
    if (!window.confirm(confirmMsg)) return;

    setIsSuspending(true);
    const adminEmail = auth.currentUser?.email || "Unknown Admin";
    const res = isCurrentlySuspended 
      ? await reinstateUser(id, adminEmail)
      : await suspendUser(id, adminEmail);
    
    if (res.success) {
      setEntity({ ...entity, status: isCurrentlySuspended ? "VERIFIED" : "SUSPENDED" });
    } else {
      alert(`Failed to ${isCurrentlySuspended ? 'reinstate' : 'suspend'} user: ` + res.error);
    }
    setIsSuspending(false);
  };

  const handleNukeOutfitter = async () => {
    const confirmMsg = "🚨 WARNING: Are you absolutely sure you want to NUKE this outfitter? This will permanently delete their Auth account, their user profile, and their outfitter profile. This CANNOT be undone.";
    if (!window.confirm(confirmMsg)) return;

    setIsNuking(true);
    const adminEmail = auth.currentUser?.email || "Unknown Admin";
    const res = await nukeOutfitter(id, adminEmail);
    
    if (res.success) {
      router.push('/admin/outfitters');
    } else {
      alert("Failed to delete outfitter completely: " + res.error);
      setIsNuking(false);
    }
  };

  const handleOpenDirectMessage = async () => {
    if (!auth.currentUser || !entity) return;
    setIsMessaging(true);

    try {
      const adminId = auth.currentUser.uid;
      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("participants", "array-contains", adminId));
      const querySnapshot = await getDocs(q);

      let existingChatId: string | null = null;
      querySnapshot.forEach((document) => {
        const data = document.data();
        if (data.participants && data.participants.includes(id)) {
          existingChatId = document.id;
        }
      });

      let chatIdToRoute: string | null = existingChatId;

      if (!chatIdToRoute) {
        const newChatRef = await addDoc(chatsRef, {
          participants: [adminId, id],
          type: "ADMIN_SUPPORT",
          outfitterName: entity.companyName || entity.name || "Outfitter",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: "Secure admin thread initialized.",
          unreadCount: { [id]: 1, [adminId]: 0 }
        });
        chatIdToRoute = newChatRef.id;
      } else {
        await updateDoc(doc(db, "chats", chatIdToRoute), {
          outfitterName: entity.companyName || entity.name || "Outfitter",
          type: "ADMIN_SUPPORT"
        });
      }
      router.push(`/messages/${chatIdToRoute}`); 
    } catch (error) {
      alert("Failed to initialize secure chat.");
    } finally {
      setIsMessaging(false);
    }
  };

  if (loading || !entity) {
    return <div className="w-full min-h-screen flex items-center justify-center"><KuduLoader /></div>;
  }

  return (
    <div className="p-4 sm:p-8 w-full relative min-h-screen flex flex-col pb-24">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button 
          onClick={() => router.push('/admin/outfitters')}
          className="p-3 bg-white dark:bg-stone-900 border border-kalahari/20 rounded-full hover:bg-kalahari/10 transition-colors text-olive dark:text-off-white shadow-sm shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-olive dark:text-off-white leading-tight">
            {entity.companyName || entity.name || "Unknown"}
          </h1>
          <p className="text-olive/50 font-bold uppercase tracking-widest text-xs mt-1">Outfitter Profile Management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Dossier & Financials */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-stone-900 border-2 border-kalahari/20 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-black text-olive dark:text-off-white uppercase mb-6 flex items-center gap-2 border-b border-kalahari/10 pb-4">
               Contact & Details
            </h3>
            
            <div className="space-y-4 mb-6">
              <p className="text-kalahari font-bold text-sm flex items-center gap-3">
                 <Mail className="h-5 w-5" /> {entity.email}
              </p>
              <p className="text-olive/70 dark:text-off-white/60 font-bold text-sm flex items-center gap-3">
                 <Phone className="h-5 w-5" /> {entity.phone || entity.phoneNumber || "No phone number"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DossierItem icon={History} label="Account Created" value={entity.createdAt ? new Date(entity.createdAt).toLocaleDateString() : "Unknown"} />
              <DossierItem icon={ExternalLink} label="System Role" value="OUTFITTER" />
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 border-2 border-kalahari/20 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-black text-olive dark:text-off-white uppercase mb-6 flex items-center gap-2 border-b border-kalahari/10 pb-4">
               Financial & Tier Overrides
            </h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* STRICT COMMISSION ENUM */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-olive/60 flex items-center gap-1.5"><Percent className="h-4 w-4 text-kalahari" /> Commission Rate</label>
                  <select 
                    value={promoCommission}
                    onChange={(e) => setPromoCommission(e.target.value)}
                    className="w-full bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl p-3 text-sm font-bold text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari"
                  >
                    <option value="">Default Platform Fee</option>
                    {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20].map(rate => (
                      <option key={rate} value={rate.toString()}>{rate}% Platform Fee</option>
                    ))}
                  </select>
                </div>
                
                {/* STRICT SUBSCRIPTION ENUM */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-olive/60 flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-kalahari" /> Subscription Rate</label>
                  <select 
                    value={promoSubscription}
                    onChange={(e) => setPromoSubscription(e.target.value)}
                    className="w-full bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl p-3 text-sm font-bold text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari"
                  >
                    <option value="">Default (ZAR 800)</option>
                    {[0, 200, 400, 600, 800, 1000].map(rate => (
                      <option key={rate} value={rate.toString()}>ZAR {rate}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* DATE CALCULATOR ENUM */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-olive/60 flex items-center gap-1.5"><Calendar className="h-4 w-4 text-kalahari" /> PRO Expiration Date</label>
                <select 
                  onChange={(e) => handleExpirationOverride(e.target.value)}
                  className="w-full bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl p-3 text-sm font-bold text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari"
                  defaultValue=""
                >
                  <option value="" disabled>Calculate an extension...</option>
                  <option value="clear">Clear Overrides (Revert to Standard)</option>
                  <option value="1">Extend +1 Month</option>
                  <option value="3">Extend +3 Months</option>
                  <option value="6">Extend +6 Months</option>
                  <option value="12">Extend +1 Year</option>
                  <option value="lifetime">Grant Lifetime Access</option>
                </select>
                <p className={`text-[10px] font-bold mt-1 ${promoExpiry ? "text-orange-500" : "text-olive/50 dark:text-white/40"}`}>
                  {promoExpiry ? `Currently Set: Expires on ${promoExpiry}` : "No active override. Account will default to STANDARD tier."}
                </p>
              </div>

              <Button 
                onClick={handleSaveFinancials} 
                disabled={isUpdatingFinancials}
                className="w-full h-14 text-lg bg-kalahari hover:bg-kalahari/90 text-white font-black rounded-xl shadow-lg transition-all"
              >
                {isUpdatingFinancials ? <Loader2 className="h-6 w-6 animate-spin" /> : "Lock In Rates"}
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Critical Actions */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-stone-900 border-2 border-kalahari/20 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-black text-olive dark:text-off-white uppercase mb-6 flex items-center gap-2 border-b border-kalahari/10 pb-4">
               Admin Critical Actions
            </h3>
            
            <div className="space-y-4">
              <button 
                onClick={handleOpenDirectMessage} 
                disabled={isMessaging} 
                className="w-full flex items-center justify-center gap-3 p-4 bg-kalahari text-white rounded-xl font-black hover:bg-kalahari/90 transition-all shadow-md disabled:opacity-50"
              >
                {isMessaging ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />} 
                {isMessaging ? "Initializing Secure Chat..." : "Open Direct Message"}
              </button>

              <button onClick={handleInspectData} disabled={isInspecting} className="w-full flex items-center justify-center gap-3 p-4 bg-olive text-white rounded-xl font-black hover:bg-olive/90 transition-all disabled:opacity-50 shadow-md">
                {isInspecting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Database className="h-5 w-5 text-kalahari" />} 
                {isInspecting ? "Pulling Records..." : "Inspect Public Records"}
              </button>

              {entityActivity && (
                <div className="p-5 bg-off-white dark:bg-stone-950 rounded-xl border border-kalahari/20 animate-in fade-in zoom-in-95 duration-200 shadow-inner">
                  <p className="font-black text-olive dark:text-white mb-3 flex items-center justify-between">
                    <span><Package className="h-4 w-4 inline mr-2 text-kalahari"/> Active Packages:</span> 
                    <span className="bg-kalahari/20 text-kalahari px-3 py-1 rounded-md">{entityActivity.activePackages}</span>
                  </p>
                  <p className="font-black text-olive dark:text-white flex items-center justify-between">
                    <span><Activity className="h-4 w-4 inline mr-2 text-kalahari"/> Total Quotes Sent:</span> 
                    <span className="bg-kalahari/20 text-kalahari px-3 py-1 rounded-md">{entityActivity.totalLeads}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-kalahari/10 space-y-4">
              {(entity.permitUrl || entity.verificationDocUrl || entity.documentUrl) ? (
                <a href={entity.permitUrl || entity.verificationDocUrl || entity.documentUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-3 p-4 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl font-black hover:bg-blue-100 transition-all border border-blue-200 shadow-sm">
                  <FileText className="h-5 w-5" /> View Uploaded Permit
                </a>
              ) : (
                <div className="w-full flex items-center justify-center gap-3 p-4 bg-gray-50 text-gray-400 rounded-xl font-black border border-gray-200 cursor-not-allowed">
                  <FileQuestion className="h-5 w-5" /> No Permit Uploaded
                </div>
              )}

              <button onClick={handleVerify} disabled={isVerifying || entity.status === "VERIFIED"} className="w-full flex items-center justify-center gap-3 p-4 bg-kalahari/10 text-kalahari rounded-xl font-black hover:bg-kalahari/20 transition-all border border-kalahari/20 disabled:opacity-50 shadow-sm">
                {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />} 
                {entity.status === "VERIFIED" ? "Identity Verified" : "Verify Identity"}
              </button>

              <button onClick={handleSuspendToggle} disabled={isSuspending} className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl font-black transition-all border disabled:opacity-50 shadow-sm ${entity.status === "SUSPENDED" ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100" : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"}`}>
                {isSuspending ? <Loader2 className="h-5 w-5 animate-spin" /> : entity.status === "SUSPENDED" ? <PlayCircle className="h-5 w-5" /> : <PauseCircle className="h-5 w-5" />} 
                {entity.status === "SUSPENDED" ? "Reinstate Account" : "Suspend Account"}
              </button>
              
              <div className="pt-8 mt-8 border-t border-red-500/20">
                <button 
                  onClick={handleNukeOutfitter} 
                  disabled={isNuking} 
                  className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl font-black hover:bg-red-100 transition-all border border-red-200 disabled:opacity-50 shadow-sm"
                >
                  {isNuking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />} 
                  {isNuking ? "Nuking User Data..." : "Permanently Delete Outfitter"}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function DossierItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4 p-4 bg-off-white dark:bg-stone-950 rounded-xl border border-kalahari/10">
      <div className="p-3 bg-kalahari/10 rounded-lg">
        <Icon className="h-5 w-5 text-kalahari" />
      </div>
      <div className="overflow-hidden">
        <p className="text-[10px] font-black uppercase text-olive/50 tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-bold text-olive dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}