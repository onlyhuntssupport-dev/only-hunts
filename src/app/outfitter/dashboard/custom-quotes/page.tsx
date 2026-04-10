"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, setDoc, getDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { 
  Target, CheckCircle, Clock, AlertCircle, ChevronRight, 
  DollarSign, Users, Calendar, Send, FileText, Check, Calculator,
  Archive, ArchiveRestore, Trash2, MapPin, ShieldCheck, Scale, FileSignature
} from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";

// NEW: Import the global calendar modal component
import BookedCalendarModal from "@/components/outfitter/BookedCalendarModal";

interface UnifiedQuote {
  id: string;
  sourceCollection: "quote_requests" | "quotes";
  hunterId: string;
  hunterName?: string;
  status: string;
  createdAt: number;
  targetSpecies: string | string[];
  logistics?: { days: number; hunters: number; observers?: number; startDate?: string; endDate?: string; province?: string; };
  notes?: string;
  totalAmount?: number;
  responseMessage?: string;
  includedItems?: string[];
  excludedItems?: string[];
  financials?: any;
  outfitterArchived?: boolean;
  outfitterRead?: boolean;
}

interface OutfitterRates {
  dailyRate: number;
  trophyFees: Record<string, any>;
}

const STANDARD_INCLUSIONS = [
  "Professional Hunter (PH)", "Field Prep of Trophies", 
  "Lodging & Meals", "Local Beer & Wine", 
  "Airport Transfer", "Daily Laundry", "Hunting Vehicle"
];

const STANDARD_EXCLUSIONS = [
  "Taxidermy", "Dipping & Shipping", "Hard Liquor", 
  "International Flights", "Gratuities", "Pre/Post Safari Accommodation"
];

function QuoteBoardContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "pending";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [quotes, setQuotes] = useState<UnifiedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<UnifiedQuote | null>(null);
  
  const [outfitterRates, setOutfitterRates] = useState<OutfitterRates | null>(null);
  const [autoCalculatedTotal, setAutoCalculatedTotal] = useState<number>(0);
  
  const [replyPrice, setReplyPrice] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  
  const [selectedInclusions, setSelectedInclusions] = useState<string[]>([]);
  const [selectedExclusions, setSelectedExclusions] = useState<string[]>([]);
  
  const [isSending, setIsSending] = useState(false);
  
  // Modal State for the Calendar
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // TOS Gate State
  const [tosAccepted, setTosAccepted] = useState<boolean | null>(null);
  const [isAcceptingTos, setIsAcceptingTos] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const outfitterDocRef = doc(db, 'outfitters', user.uid);
        const outfitterSnap = await getDoc(outfitterDocRef);
        
        if (outfitterSnap.exists()) {
          setTosAccepted(outfitterSnap.data().hasAcceptedParityTOS === true);
        } else {
          setTosAccepted(false);
        }

        const matrixRef = doc(db, 'outfitters', user.uid, 'documents', 'pricing_matrix');
        const matrixSnap = await getDoc(matrixRef);
        
        if (matrixSnap.exists()) {
          const data = matrixSnap.data();
          const dRate = data.dailyRates?.hunter1v1 || 0; 
          const tFees: Record<string, number> = {};
          
          if (Array.isArray(data.species)) {
            data.species.forEach((s: any) => {
              if (s.name && s.price) tFees[s.name] = Number(s.price);
            });
          }
          
          if (Array.isArray(data.customSpecies)) {
            data.customSpecies.forEach((s: any) => {
              if (s.name && s.price) tFees[s.name] = Number(s.price);
            });
          }
          
          setOutfitterRates({
            dailyRate: parseFloat(dRate.toString()) || 0,
            trophyFees: tFees
          });
        }

        let mergedQuotes: UnifiedQuote[] = [];

        const reqQuery = query(collection(db, "quote_requests"), where("outfitterId", "==", user.uid));
        const reqSnap = await getDocs(reqQuery);
        reqSnap.forEach(doc => {
          const data = doc.data();
          mergedQuotes.push({
            id: doc.id,
            sourceCollection: "quote_requests",
            ...data,
            createdAt: data.createdAt?.toMillis?.() || Date.now(),
          } as UnifiedQuote);
        });

        const autoQuery = query(collection(db, "quotes"), where("outfitterId", "==", user.uid));
        const autoSnap = await getDocs(autoQuery);
        autoSnap.forEach(doc => {
          const data = doc.data();
          mergedQuotes.push({
            id: doc.id,
            sourceCollection: "quotes",
            ...data,
            createdAt: data.createdAt?.toMillis?.() || Date.now(),
          } as UnifiedQuote);
        });

        mergedQuotes.sort((a, b) => b.createdAt - a.createdAt);
        setQuotes(mergedQuotes);
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  useEffect(() => {
    const markAsRead = async () => {
      if (selectedQuote && !selectedQuote.outfitterRead) {
        try {
          const quoteRef = doc(db, selectedQuote.sourceCollection, selectedQuote.id);
          await setDoc(quoteRef, { outfitterRead: true }, { merge: true });
          
          setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, outfitterRead: true } : q));
        } catch (error) {
          console.error("Error marking quote as read:", error);
        }
      }
    };
    
    markAsRead();
  }, [selectedQuote?.id]);

  useEffect(() => {
    if (selectedQuote && selectedQuote.status === "PENDING_OUTFITTER_REVIEW" && outfitterRates) {
      let total = 0;
      const days = selectedQuote.logistics?.days || 0;
      const hunters = selectedQuote.logistics?.hunters || 0;
      total += (days * hunters * outfitterRates.dailyRate);

      const speciesArray = Array.isArray(selectedQuote.targetSpecies) 
        ? selectedQuote.targetSpecies 
        : [selectedQuote.targetSpecies];
        
      speciesArray.forEach(sp => {
        const fee = outfitterRates.trophyFees[sp];
        if (fee) total += fee;
      });

      setAutoCalculatedTotal(total);
      
      if (total > 0) setReplyPrice(total.toString());
      else setReplyPrice("");
    } else {
      setReplyPrice("");
      setAutoCalculatedTotal(0);
    }
    
    setReplyMessage("");
    setSelectedInclusions([]);
    setSelectedExclusions([]);
  }, [selectedQuote, outfitterRates]);

  const handleAgreeToTOS = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setIsAcceptingTos(true);
    try {
      const outfitterRef = doc(db, 'outfitters', user.uid);
      await setDoc(outfitterRef, { 
        hasAcceptedParityTOS: true,
        parityTOSAcceptedAt: serverTimestamp() 
      }, { merge: true });
      
      setTosAccepted(true);
    } catch (error) {
      console.error("Error accepting TOS:", error);
      alert("There was an issue saving your agreement. Please try again.");
    } finally {
      setIsAcceptingTos(false);
    }
  };

  const filteredQuotes = quotes.filter(q => {
    if (activeTab === "archived") return q.outfitterArchived;
    if (q.outfitterArchived) return false;
    
    if (activeTab === "pending") return q.status === "PENDING_OUTFITTER_REVIEW";
    if (activeTab === "waiting") return q.status === "QUOTE_PROVIDED" || q.status === "PENDING_HUNTER_ACCEPTANCE";
    if (activeTab === "accepted") return q.status === "ACCEPTED";
    return false;
  });

  useEffect(() => {
    if (filteredQuotes.length > 0 && (!selectedQuote || selectedQuote.status !== filteredQuotes[0].status || selectedQuote.outfitterArchived !== filteredQuotes[0].outfitterArchived)) {
      setSelectedQuote(filteredQuotes[0]);
    } else if (filteredQuotes.length === 0) {
      setSelectedQuote(null);
    }
  }, [activeTab, quotes]);

  const handleToggleInclusion = (item: string) => {
    setSelectedInclusions(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const handleToggleExclusion = (item: string) => {
    setSelectedExclusions(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote || !replyPrice) return;
    
    setIsSending(true);
    try {
      const quoteRef = doc(db, selectedQuote.sourceCollection, selectedQuote.id);
      
      let compiledMessage = "";
      if (selectedInclusions.length > 0) compiledMessage += `✓ INCLUDED:\n• ${selectedInclusions.join('\n• ')}\n\n`;
      if (selectedExclusions.length > 0) compiledMessage += `✗ EXCLUDED:\n• ${selectedExclusions.join('\n• ')}\n\n`;
      if (replyMessage.trim()) compiledMessage += `ADDITIONAL NOTES:\n${replyMessage.trim()}`;
      if (!compiledMessage.trim()) compiledMessage = "Custom quote details provided. Please review pricing.";
      
      const updateData = {
        status: "QUOTE_PROVIDED",
        totalAmount: parseFloat(replyPrice),
        responseMessage: compiledMessage,
        includedItems: selectedInclusions, 
        excludedItems: selectedExclusions, 
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: serverTimestamp()
      };

      await setDoc(quoteRef, updateData, { merge: true });

      setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, ...updateData } : q));
      setActiveTab("waiting"); 
      setReplyPrice("");
      setReplyMessage("");
      setSelectedInclusions([]);
      setSelectedExclusions([]);

    } catch (error) {
      console.error("Error sending quote:", error);
      alert("Failed to send quote to hunter.");
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleArchive = async (quote: UnifiedQuote, toArchive: boolean) => {
    if (toArchive && !window.confirm("Are you sure you want to move this to your archive?")) return;
    
    try {
      const quoteRef = doc(db, quote.sourceCollection, quote.id);
      await setDoc(quoteRef, { outfitterArchived: toArchive }, { merge: true });
      
      setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, outfitterArchived: toArchive } : q));
      setSelectedQuote(null);
    } catch (error) {
      console.error("Error archiving quote:", error);
      alert("Failed to update archive status.");
    }
  };

  const handlePermanentDelete = async (quote: UnifiedQuote) => {
    if (!window.confirm("Are you absolutely sure you want to permanently delete this quote? This action cannot be undone.")) return;
    
    try {
      const quoteRef = doc(db, quote.sourceCollection, quote.id);
      await deleteDoc(quoteRef);
      
      setQuotes(prev => prev.filter(q => q.id !== quote.id));
      setSelectedQuote(null);
    } catch (error) {
      console.error("Error permanently deleting quote:", error);
      alert("Failed to delete quote.");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-off-white dark:bg-stone-950"><KuduLoader /></div>;

  if (tosAccepted === false) {
    return (
      <div className="min-h-screen bg-off-white dark:bg-stone-950 py-12 px-4 sm:px-6 flex flex-col justify-center items-center">
        <div className="max-w-2xl w-full bg-white dark:bg-stone-900 border border-kalahari/30 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-kalahari"></div>
          <div className="mx-auto w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-6">
            <Scale className="h-10 w-10 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-3xl font-black font-headline text-center text-olive dark:text-white mb-6">
            Platform Operating Agreement
          </h2>
          <div className="space-y-6 text-olive/80 dark:text-off-white/80 font-medium leading-relaxed mb-10">
            <p>
              To access the Custom Safari Inbox and secure bookings, you must agree to our marketplace operating terms.
            </p>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-black/30 p-5 rounded-xl border border-gray-200 dark:border-gray-800">
                <h3 className="font-bold text-olive dark:text-white mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-kalahari" /> 1. Strict Price Parity
                </h3>
                <p className="text-sm">
                  The final quoted price you provide to a hunter on this platform <strong>must be equal to or less than</strong> the price for the exact same package/parameters offered directly on your own website or any other public booking platform.
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/20 p-5 rounded-xl border border-orange-200 dark:border-orange-900/30">
                <h3 className="font-bold text-orange-900 dark:text-orange-400 mb-2 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> 2. Commission & Split Deposits
                </h3>
                <p className="text-sm text-orange-800/80 dark:text-orange-300/80">
                  In addition to your platform subscription, Only-Hunts retains a flat <strong>10% commission</strong> on the total value of successfully booked custom quotes. 
                  <br /><br />
                  When a hunter signs your proposal, they will pay an upfront deposit via Paystack. Our 10% fee is automatically deducted from this deposit, and the remainder is routed instantly to your connected payout account. You will collect the final balance directly from the hunter upon arrival.
                </p>
              </div>
            </div>
            <p className="text-sm border-l-4 border-orange-500 pl-4 py-1">
              Violating this agreement—including attempting to bypass the platform checkout to avoid commission fees—will result in immediate account termination.
            </p>
          </div>
          <button 
            onClick={handleAgreeToTOS}
            disabled={isAcceptingTos}
            className="w-full bg-olive hover:bg-olive/90 dark:bg-kalahari dark:hover:bg-kalahari/90 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAcceptingTos ? "Recording Agreement..." : <><FileSignature className="h-5 w-5" /> I Agree to the Operating Terms</>}
          </button>
        </div>
      </div>
    );
  }

  const counts = {
    pending: quotes.filter(q => q.status === "PENDING_OUTFITTER_REVIEW" && !q.outfitterArchived && !q.outfitterRead).length,
    waiting: quotes.filter(q => (q.status === "QUOTE_PROVIDED" || q.status === "PENDING_HUNTER_ACCEPTANCE") && !q.outfitterArchived).length,
    accepted: quotes.filter(q => q.status === "ACCEPTED" && !q.outfitterArchived).length,
    archived: quotes.filter(q => q.outfitterArchived).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* MODAL INSTANCE */}
      <BookedCalendarModal 
        isOpen={showCalendarModal} 
        onClose={() => setShowCalendarModal(false)} 
        quotes={quotes} 
        currentQuote={selectedQuote} 
      />

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black font-headline text-olive dark:text-off-white tracking-tight flex items-center gap-3">
            <Target className="h-8 w-8 text-kalahari" /> Only-Quotes Review Board
          </h1>
          <p className="text-olive/70 dark:text-off-white/60 font-medium mt-2">Manage your bespoke pricing requests and active bookings.</p>
        </div>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar border-b-2 border-kalahari/20 dark:border-stone-800 mb-8 pt-2">
        <button onClick={() => setActiveTab('pending')} className={`px-6 py-4 font-black text-sm uppercase tracking-widest whitespace-nowrap border-b-4 flex items-center gap-2 transition-colors ${activeTab === 'pending' ? 'border-orange-500 text-orange-500' : 'border-transparent text-olive/50 dark:text-white/40 hover:text-olive dark:hover:text-white'}`}>
          <AlertCircle className="h-4 w-4" /> Action Required {counts.pending > 0 && <span className="ml-1 bg-orange-500 text-white animate-pulse py-0.5 px-2 rounded-full text-xs">{counts.pending}</span>}
        </button>
        <button onClick={() => setActiveTab('waiting')} className={`px-6 py-4 font-black text-sm uppercase tracking-widest whitespace-nowrap border-b-4 flex items-center gap-2 transition-colors ${activeTab === 'waiting' ? 'border-kalahari text-kalahari' : 'border-transparent text-olive/50 dark:text-white/40 hover:text-olive dark:hover:text-white'}`}>
          <Clock className="h-4 w-4" /> Pending Hunter <span className="ml-1 bg-kalahari/10 text-kalahari py-0.5 px-2 rounded-full text-xs">{counts.waiting}</span>
        </button>
        <button onClick={() => setActiveTab('accepted')} className={`px-6 py-4 font-black text-sm uppercase tracking-widest whitespace-nowrap border-b-4 flex items-center gap-2 transition-colors ${activeTab === 'accepted' ? 'border-green-500 text-green-500' : 'border-transparent text-olive/50 dark:text-white/40 hover:text-olive dark:hover:text-white'}`}>
          <CheckCircle className="h-4 w-4" /> Accepted / Locked <span className="ml-1 bg-green-500/10 text-green-500 py-0.5 px-2 rounded-full text-xs">{counts.accepted}</span>
        </button>
        <button onClick={() => setActiveTab('archived')} className={`px-6 py-4 font-black text-sm uppercase tracking-widest whitespace-nowrap border-b-4 flex items-center gap-2 transition-colors ${activeTab === 'archived' ? 'border-gray-500 text-gray-700 dark:text-gray-300' : 'border-transparent text-olive/50 dark:text-white/40 hover:text-olive dark:hover:text-white'}`}>
          <Archive className="h-4 w-4" /> Archived <span className="ml-1 bg-gray-500/10 text-gray-600 dark:text-gray-400 py-0.5 px-2 rounded-full text-xs">{counts.archived}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        <div className="lg:col-span-1 space-y-3 pr-2">
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-12 bg-white/50 dark:bg-stone-900/50 rounded-2xl border-2 border-dashed border-kalahari/20">
              {activeTab === 'archived' ? <Archive className="h-10 w-10 text-kalahari/30 mx-auto mb-3" /> : <FileText className="h-10 w-10 text-kalahari/30 mx-auto mb-3" />}
              <p className="text-sm font-bold text-olive/50 dark:text-off-white/40">No quotes in this folder</p>
            </div>
          ) : (
            filteredQuotes.map((q) => (
              <button
                key={q.id}
                onClick={() => setSelectedQuote(q)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                  selectedQuote?.id === q.id 
                    ? "bg-white dark:bg-stone-900 border-kalahari shadow-md scale-[1.02]" 
                    : "bg-white/50 dark:bg-stone-900/50 border-kalahari/10 hover:border-kalahari/30"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-black text-base line-clamp-1 pr-4 ${!q.outfitterRead && activeTab === 'pending' ? 'text-orange-500 dark:text-orange-400' : 'text-olive dark:text-off-white'}`}>
                    {q.hunterName || "Registered Hunter"}
                  </h3>
                  {selectedQuote?.id === q.id && <ChevronRight className="h-5 w-5 text-kalahari shrink-0" />}
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-3 flex-wrap">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-kalahari" /> {q.logistics?.days || '?'} Days</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-kalahari" /> {q.logistics?.hunters || '?'} Hunters</span>
                  {q.logistics?.province && (
                    <span className="flex items-center gap-1 w-full mt-1 text-kalahari/80"><MapPin className="h-3 w-3" /> {q.logistics.province}</span>
                  )}
                </div>
                <p className="text-xs font-medium text-olive/80 dark:text-off-white/70 line-clamp-1 border-t border-kalahari/10 pt-2">
                  <Target className="h-3 w-3 inline mr-1 text-kalahari" />
                  {Array.isArray(q.targetSpecies) ? q.targetSpecies.join(", ") : q.targetSpecies}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2">

          {selectedQuote ? (
            <div className="bg-white dark:bg-stone-900 border border-kalahari/20 rounded-3xl overflow-hidden shadow-xl mb-12">
              
              <div className={`p-6 text-white relative overflow-hidden ${
                activeTab === 'pending' ? 'bg-orange-600' : 
                activeTab === 'accepted' ? 'bg-green-600' : 
                activeTab === 'archived' ? 'bg-gray-600' : 'bg-olive'
              }`}>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black font-headline mb-1 flex items-center gap-3">
                      {selectedQuote.hunterName || "Registered Hunter"}
                      {selectedQuote.outfitterArchived && (
                        <span className="bg-white/20 text-white text-[10px] uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1">
                          <Archive className="h-3 w-3" /> Archived
                        </span>
                      )}
                    </h2>
                    <p className="text-white/80 font-medium text-sm flex items-center gap-2">
                      Requested on {new Date(selectedQuote.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!selectedQuote.outfitterArchived ? (
                      <button 
                        onClick={() => handleToggleArchive(selectedQuote, true)}
                        className="bg-black/20 hover:bg-black/40 transition-colors backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 group"
                        title="Archive Quote"
                      >
                        <Archive className="h-4 w-4 group-hover:scale-110 transition-transform" /> Archive Quote
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleToggleArchive(selectedQuote, false)}
                          className="bg-white/20 hover:bg-white/40 transition-colors backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"
                        >
                          <ArchiveRestore className="h-4 w-4" /> Restore
                        </button>
                        <button 
                          onClick={() => handlePermanentDelete(selectedQuote)}
                          className="bg-red-500/20 hover:bg-red-500/40 transition-colors backdrop-blur-sm px-4 py-2 rounded-lg border border-red-500/30 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </>
                    )}
                    <div className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10 text-xs font-black uppercase tracking-widest text-center hidden sm:block">
                      {selectedQuote.sourceCollection === "quotes" ? "Auto Engine" : "Manual Request"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-kalahari/5 border-b border-kalahari/10 p-4 px-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-x divide-kalahari/20">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-[10px] font-black text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><Calendar className="h-3 w-3" /> Dates</p>
                  <p className="font-bold text-olive dark:text-white text-sm">
                    {selectedQuote.logistics?.startDate && selectedQuote.logistics?.endDate 
                      ? `${formatDate(selectedQuote.logistics.startDate)} to ${formatDate(selectedQuote.logistics.endDate)}` 
                      : 'Flexible'}
                  </p>
                  {/* MODAL TRIGGER BUTTON */}
                  {selectedQuote.logistics?.startDate && (
                    <button 
                      onClick={() => setShowCalendarModal(true)} 
                      className="mt-1.5 text-[10px] bg-kalahari/10 hover:bg-orange-500/20 text-kalahari hover:text-orange-500 font-black uppercase tracking-widest px-2 py-1 rounded transition-colors"
                    >
                      Check Calendar
                    </button>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center">
                  <p className="text-[10px] font-black text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><MapPin className="h-3 w-3" /> Location</p>
                  <p className="font-bold text-olive dark:text-white text-sm">
                    {selectedQuote.logistics?.province || 'Any'}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <p className="text-[10px] font-black text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><Clock className="h-3 w-3" /> Duration</p>
                  <p className="font-bold text-olive dark:text-white text-sm">{selectedQuote.logistics?.days || '?'} Days</p>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <p className="text-[10px] font-black text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><Users className="h-3 w-3" /> Group</p>
                  <p className="font-bold text-olive dark:text-white text-sm">{selectedQuote.logistics?.hunters || 0}H / {selectedQuote.logistics?.observers || 0}O</p>
                </div>
              </div>

              <div className="p-8">
                
                {selectedQuote.notes && (
                  <div className="mb-8">
                    <h4 className="text-xs font-black text-olive/50 dark:text-off-white/40 uppercase tracking-widest mb-3">Hunter's Notes</h4>
                    <div className="bg-gray-50 dark:bg-stone-950 p-5 rounded-xl border border-kalahari/10 text-olive dark:text-off-white/80 font-medium italic">
                      "{selectedQuote.notes}"
                    </div>
                  </div>
                )}

                {activeTab === 'pending' && !selectedQuote.outfitterArchived && (
                  <form onSubmit={handleSendQuote} className="bg-orange-50 dark:bg-orange-950/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-900/50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-black text-orange-900 dark:text-orange-400 flex items-center gap-2">
                        <DollarSign className="h-5 w-5" /> Build Pricing Proposal
                      </h3>
                      {autoCalculatedTotal > 0 && (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-orange-200 text-orange-800 px-2 py-1 rounded flex items-center gap-1">
                          <Calculator className="h-3 w-3" /> System Auto-Priced
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-orange-800/60 dark:text-orange-400/60 uppercase tracking-widest mb-2">Total Price (USD)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input 
                            type="number" 
                            required
                            min="1"
                            value={replyPrice}
                            onChange={(e) => setReplyPrice(e.target.value)}
                            className="w-full bg-white dark:bg-stone-900 border border-orange-200 dark:border-orange-800 rounded-xl py-4 pl-12 pr-4 text-xl font-black text-olive dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="0.00"
                          />
                        </div>
                        {autoCalculatedTotal === 0 && (
                          <p className="text-xs font-medium text-orange-800/60 mt-2">
                            * We couldn't match some requested species to your saved rate card. Please verify your total.
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-6 bg-white/50 dark:bg-black/20 rounded-xl p-6 border border-orange-200 dark:border-orange-900/30">
                        
                        <div>
                          <p className="text-xs font-black text-green-700 dark:text-green-500 uppercase tracking-widest mb-4 border-b border-green-200 dark:border-green-900/50 pb-2">Included in Quote</p>
                          <div className="flex flex-wrap gap-x-5 gap-y-3">
                            {STANDARD_INCLUSIONS.map(item => (
                              <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                  type="checkbox"
                                  checked={selectedInclusions.includes(item)}
                                  onChange={() => handleToggleInclusion(item)}
                                  className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500 dark:bg-stone-800 dark:border-gray-600"
                                />
                                <span className="text-sm font-medium text-olive dark:text-white group-hover:text-green-600 transition-colors">{item}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="mt-2">
                          <p className="text-xs font-black text-red-700 dark:text-red-500 uppercase tracking-widest mb-4 border-b border-red-200 dark:border-red-900/50 pb-2">Excluded from Quote</p>
                          <div className="flex flex-wrap gap-x-5 gap-y-3">
                            {STANDARD_EXCLUSIONS.map(item => (
                              <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                  type="checkbox"
                                  checked={selectedExclusions.includes(item)}
                                  onChange={() => handleToggleExclusion(item)}
                                  className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 dark:bg-stone-800 dark:border-gray-600"
                                />
                                <span className="text-sm font-medium text-olive dark:text-white group-hover:text-red-600 transition-colors">{item}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 border-t border-orange-200 dark:border-orange-900/30 pt-6">
                           <p className="text-xs font-black text-orange-800/80 dark:text-orange-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <Target className="h-4 w-4"/> Target Species for this Quote
                           </p>
                           <div className="flex flex-wrap gap-2">
                             {Array.isArray(selectedQuote.targetSpecies)
                                ? selectedQuote.targetSpecies.map(ts => <span key={ts} className="bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 px-3 py-1.5 rounded-lg text-sm font-bold border border-orange-200 dark:border-orange-800">{ts}</span>)
                                : <span className="bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 px-3 py-1.5 rounded-lg text-sm font-bold border border-orange-200 dark:border-orange-800">{selectedQuote.targetSpecies}</span>
                             }
                           </div>
                        </div>
                        
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-orange-800/60 dark:text-orange-400/60 uppercase tracking-widest mb-2">Additional Notes (Optional)</label>
                        <textarea 
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          className="w-full h-24 bg-white dark:bg-stone-900 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-sm font-medium text-olive dark:text-white outline-none focus:ring-2 focus:ring-orange-500 resize-none custom-scrollbar leading-relaxed"
                          placeholder="Add any specific details, confirm available dates, or add welcome messages..."
                        />
                      </div>

                      <button 
                        type="submit"
                        disabled={isSending || !replyPrice || (selectedInclusions.length === 0 && !replyMessage)}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSending ? "Compiling & Sending..." : <><Send className="h-5 w-5" /> Compile & Send Quote</>}
                      </button>
                    </div>
                  </form>
                )}

                {((activeTab === 'waiting' || activeTab === 'accepted' || activeTab === 'archived') && selectedQuote.status !== "PENDING_OUTFITTER_REVIEW") && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-stone-950 p-6 rounded-xl border border-kalahari/10 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-black text-olive/50 dark:text-off-white/40 uppercase tracking-widest mb-1">Quoted Price</p>
                        <p className="text-3xl font-black text-olive dark:text-white">${selectedQuote.totalAmount?.toLocaleString() || selectedQuote.financials?.totalUsd?.toLocaleString() || "N/A"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-olive/50 dark:text-off-white/40 uppercase tracking-widest mb-1">Status</p>
                        {selectedQuote.status === "QUOTE_PROVIDED" || selectedQuote.status === "PENDING_HUNTER_ACCEPTANCE" ? (
                          <span className="inline-flex items-center gap-1.5 bg-kalahari/10 text-kalahari px-3 py-1.5 rounded-lg text-sm font-bold"><Clock className="h-4 w-4" /> Awaiting Signature</span>
                        ) : selectedQuote.status === "ACCEPTED" ? (
                          <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-500 px-3 py-1.5 rounded-lg text-sm font-bold"><Check className="h-4 w-4" /> Locked & Signed</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-gray-500/10 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-bold">{selectedQuote.status.replace(/_/g, ' ')}</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-stone-900 border border-kalahari/20 rounded-xl p-6">
                      <p className="text-xs font-black text-olive/50 dark:text-off-white/40 uppercase tracking-widest mb-4">Your Sent Proposal Details</p>
                      
                      {selectedQuote.includedItems || selectedQuote.excludedItems ? (
                        <div className="space-y-6">
                          {selectedQuote.includedItems && selectedQuote.includedItems.length > 0 && (
                            <div>
                              <p className="text-xs font-black text-green-600 dark:text-green-500 uppercase tracking-widest mb-2 border-b border-kalahari/10 pb-2">Included</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-2">
                                {selectedQuote.includedItems.map(item => (
                                  <span key={item} className="text-sm font-medium text-olive dark:text-off-white/80 flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500"/> {item}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedQuote.excludedItems && selectedQuote.excludedItems.length > 0 && (
                            <div>
                              <p className="text-xs font-black text-red-600 dark:text-red-500 uppercase tracking-widest mb-2 border-b border-kalahari/10 pb-2">Excluded</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-2">
                                {selectedQuote.excludedItems.map(item => (
                                  <span key={item} className="text-sm font-medium text-olive dark:text-off-white/80 flex items-center gap-1.5"><span className="text-red-500 font-bold px-1">✗</span> {item}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="pt-4 border-t border-kalahari/10">
                            <p className="text-xs font-black text-kalahari uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Target className="h-4 w-4"/> Target Species
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {Array.isArray(selectedQuote.targetSpecies)
                                ? selectedQuote.targetSpecies.map(ts => <span key={ts} className="bg-kalahari/10 text-olive dark:text-off-white px-3 py-1.5 rounded-lg text-sm font-bold border border-kalahari/20">{ts}</span>)
                                : <span className="bg-kalahari/10 text-olive dark:text-off-white px-3 py-1.5 rounded-lg text-sm font-bold border border-kalahari/20">{selectedQuote.targetSpecies}</span>
                              }
                            </div>
                          </div>

                          {selectedQuote.responseMessage && !selectedQuote.responseMessage.startsWith("✓ INCLUDED") && (
                            <div className="mt-4 pt-4 border-t border-kalahari/10 text-sm font-medium text-olive dark:text-off-white/80 whitespace-pre-wrap">
                              <p className="text-xs font-black text-olive/50 dark:text-off-white/40 uppercase tracking-widest mb-2">Additional Notes</p>
                              {selectedQuote.responseMessage}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-olive dark:text-off-white/80 whitespace-pre-wrap leading-relaxed">
                          {selectedQuote.responseMessage || "No message provided."}
                          <div className="mt-6 pt-4 border-t border-kalahari/10">
                            <p className="text-xs font-black text-kalahari uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Target className="h-4 w-4"/> Target Species
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {Array.isArray(selectedQuote.targetSpecies)
                                ? selectedQuote.targetSpecies.map(ts => <span key={ts} className="bg-kalahari/10 text-olive dark:text-off-white px-3 py-1.5 rounded-lg text-sm font-bold border border-kalahari/20">{ts}</span>)
                                : <span className="bg-kalahari/10 text-olive dark:text-off-white px-3 py-1.5 rounded-lg text-sm font-bold border border-kalahari/20">{selectedQuote.targetSpecies}</span>
                              }
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ========================================== */}
                    {/* UPDATED: DEAL SECURED / PAYSTACK SUCCESS   */}
                    {/* ========================================== */}
                    {selectedQuote.status === 'ACCEPTED' && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800 animate-in zoom-in-95">
                        <div className="flex flex-col items-center text-center mb-6">
                          <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                          <h3 className="text-xl font-black text-green-900 dark:text-green-400">Booking Confirmed & Secured</h3>
                          <p className="text-sm font-medium text-green-800 dark:text-green-300 mt-2">
                            The client has executed the Wounded Game Policy and remitted the required deposit.
                          </p>
                        </div>
                        <div className="bg-white/60 dark:bg-black/20 p-4 rounded-lg border border-green-200 dark:border-green-700/50 text-sm font-medium text-green-900 dark:text-green-300">
                          <p className="font-bold mb-2 uppercase tracking-widest text-xs text-green-700 dark:text-green-500">Transaction Summary:</p>
                          <ul className="space-y-2 text-left list-disc list-inside pl-2">
                            <li><strong className="text-green-900 dark:text-green-200">Commission Settled:</strong> Platform fees have been automatically deducted via Paystack.</li>
                            <li><strong className="text-green-900 dark:text-green-200">Payout Routed:</strong> Your net deposit has been successfully transferred to your linked payout account.</li>
                            <li><strong className="text-green-900 dark:text-green-200">Outstanding Balance:</strong> The remaining balance is to be collected directly from the client upon arrival.</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-olive/40 dark:text-off-white/30 font-bold border-2 border-dashed border-kalahari/20 rounded-3xl p-12">
              <Target className="h-16 w-16 text-kalahari/20 mb-4" />
              Select a quote from the inbox to view details
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-off-white dark:bg-stone-950"><KuduLoader /></div>}>
      <QuoteBoardContent />
    </Suspense>
  );
}