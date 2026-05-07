"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Target, AlertCircle, Clock, CheckCircle, Archive, Scale, FileSignature } from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";
import BookedCalendarModal from "@/components/outfitter/BookedCalendarModal";
import QuoteList from "@/components/outfitter/quotes/QuoteList";
import QuoteDetail from "@/components/outfitter/quotes/QuoteDetail";
import { UnifiedQuote, OutfitterRates } from "@/types/quotes";

function QuoteBoardContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "pending");
  const [quotes, setQuotes] = useState<UnifiedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<UnifiedQuote | null>(null);
  const [outfitterRates, setOutfitterRates] = useState<OutfitterRates | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [tosAccepted, setTosAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const outfitterSnap = await getDoc(doc(db, 'outfitters', user.uid));
        setTosAccepted(outfitterSnap.exists() ? outfitterSnap.data().hasAcceptedParityTOS === true : false);

        const matrixSnap = await getDoc(doc(db, 'outfitters', user.uid, 'documents', 'pricing_matrix'));
        if (matrixSnap.exists()) {
          const data = matrixSnap.data();
          const tFees: Record<string, number> = {};
          [...(data.species || []), ...(data.customSpecies || [])].forEach((s: any) => { if (s.name && s.price) tFees[s.name] = Number(s.price); });
          setOutfitterRates({ dailyRate: parseFloat(data.dailyRates?.hunter1v1?.toString() || "0"), trophyFees: tFees });
        }

        const merged: UnifiedQuote[] = [];
        const [reqSnap, autoSnap] = await Promise.all([
          getDocs(query(collection(db, "quote_requests"), where("outfitterId", "==", user.uid))),
          getDocs(query(collection(db, "quotes"), where("outfitterId", "==", user.uid)))
        ]);
        
        reqSnap.forEach(d => merged.push({ id: d.id, sourceCollection: "quote_requests", ...d.data(), createdAt: d.data().createdAt?.toMillis?.() || Date.now() } as UnifiedQuote));
        autoSnap.forEach(d => merged.push({ id: d.id, sourceCollection: "quotes", ...d.data(), createdAt: d.data().createdAt?.toMillis?.() || Date.now() } as UnifiedQuote));
        
        setQuotes(merged.sort((a, b) => b.createdAt - a.createdAt));
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchAllData();
  }, []);

  useEffect(() => {
    if (selectedQuote && !selectedQuote.outfitterRead) {
      setDoc(doc(db, selectedQuote.sourceCollection, selectedQuote.id), { outfitterRead: true }, { merge: true });
      setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, outfitterRead: true } : q));
    }
  }, [selectedQuote]);

  const filteredQuotes = quotes.filter(q => {
    if (activeTab === "archived") return q.outfitterArchived;
    if (q.outfitterArchived) return false;
    if (activeTab === "pending") return q.status === "PENDING_OUTFITTER_REVIEW";
    if (activeTab === "waiting") return q.status === "QUOTE_PROVIDED" || q.status === "PENDING_HUNTER_ACCEPTANCE";
    return activeTab === "accepted" ? q.status === "ACCEPTED" : false;
  });

  useEffect(() => {
    if (filteredQuotes.length > 0 && (!selectedQuote || selectedQuote.status !== filteredQuotes[0].status || selectedQuote.outfitterArchived !== filteredQuotes[0].outfitterArchived)) {
      setSelectedQuote(filteredQuotes[0]);
    } else if (filteredQuotes.length === 0) setSelectedQuote(null);
  }, [activeTab, quotes, filteredQuotes, selectedQuote]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><KuduLoader /></div>;
  if (tosAccepted === false) return <TosGate onAccept={async () => setTosAccepted(true)} />;

  const counts = {
    pending: quotes.filter(q => q.status === "PENDING_OUTFITTER_REVIEW" && !q.outfitterArchived && !q.outfitterRead).length,
    waiting: quotes.filter(q => (q.status === "QUOTE_PROVIDED" || q.status === "PENDING_HUNTER_ACCEPTANCE") && !q.outfitterArchived).length,
    accepted: quotes.filter(q => q.status === "ACCEPTED" && !q.outfitterArchived).length,
    archived: quotes.filter(q => q.outfitterArchived).length
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <BookedCalendarModal isOpen={showCalendarModal} onClose={() => setShowCalendarModal(false)} quotes={quotes} currentQuote={selectedQuote} />

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-olive flex items-center gap-3"><Target className="h-8 w-8 text-kalahari" /> Only-Quotes Review Board</h1>
      </div>

      <div className="flex overflow-x-auto border-b-2 border-kalahari/20 mb-8 pt-2">
        <button onClick={() => setActiveTab('pending')} className={`px-6 py-4 font-black text-sm uppercase tracking-widest border-b-4 flex items-center gap-2 ${activeTab === 'pending' ? 'border-orange-500 text-orange-500' : 'border-transparent text-olive/50'}`}>
          <AlertCircle className="h-4 w-4" /> Action Required <span className="ml-1 bg-orange-500 text-white py-0.5 px-2 rounded-full text-xs">{counts.pending}</span>
        </button>
        <button onClick={() => setActiveTab('waiting')} className={`px-6 py-4 font-black text-sm uppercase tracking-widest border-b-4 flex items-center gap-2 ${activeTab === 'waiting' ? 'border-kalahari text-kalahari' : 'border-transparent text-olive/50'}`}>
          <Clock className="h-4 w-4" /> Pending Hunter <span className="ml-1 bg-kalahari/10 text-kalahari py-0.5 px-2 rounded-full text-xs">{counts.waiting}</span>
        </button>
        <button onClick={() => setActiveTab('accepted')} className={`px-6 py-4 font-black text-sm uppercase tracking-widest border-b-4 flex items-center gap-2 ${activeTab === 'accepted' ? 'border-green-500 text-green-500' : 'border-transparent text-olive/50'}`}>
          <CheckCircle className="h-4 w-4" /> Accepted <span className="ml-1 bg-green-500/10 text-green-500 py-0.5 px-2 rounded-full text-xs">{counts.accepted}</span>
        </button>
        <button onClick={() => setActiveTab('archived')} className={`px-6 py-4 font-black text-sm uppercase tracking-widest border-b-4 flex items-center gap-2 ${activeTab === 'archived' ? 'border-gray-500 text-gray-700' : 'border-transparent text-olive/50'}`}>
          <Archive className="h-4 w-4" /> Archived <span className="ml-1 bg-gray-500/10 text-gray-600 py-0.5 px-2 rounded-full text-xs">{counts.archived}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <QuoteList quotes={filteredQuotes} selectedQuote={selectedQuote} activeTab={activeTab} onSelect={setSelectedQuote} />
        </div>
        <div className="lg:col-span-2">
          {selectedQuote ? (
            <QuoteDetail 
              quote={selectedQuote} 
              activeTab={activeTab} 
              outfitterRates={outfitterRates} 
              onUpdate={(updated) => {
                setQuotes(prev => prev.map(q => q.id === updated.id ? updated : q));
                if (updated.status === 'QUOTE_PROVIDED') setActiveTab('waiting');
              }}
              onDelete={(id) => {
                setQuotes(prev => prev.filter(q => q.id !== id));
                setSelectedQuote(null);
              }}
              onOpenCalendar={() => setShowCalendarModal(true)}
            />
          ) : (
            <div className="h-full min-h-[400px] flex items-center justify-center font-bold text-olive/40 border-2 border-dashed border-kalahari/20 rounded-3xl p-12">Select a quote</div>
          )}
        </div>
      </div>
    </div>
  );
}

function TosGate({ onAccept }: { onAccept: () => void }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white p-8 rounded-3xl shadow-2xl text-center">
        <Scale className="h-10 w-10 text-orange-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black mb-4">Platform Operating Agreement</h2>
        <button 
          onClick={async () => { setLoading(true); await setDoc(doc(db, 'outfitters', auth.currentUser!.uid), { hasAcceptedParityTOS: true, parityTOSAcceptedAt: serverTimestamp() }, { merge: true }); onAccept(); }} 
          disabled={loading} 
          className="w-full bg-olive text-white font-black py-4 rounded-xl flex items-center justify-center gap-2"
        >
          <FileSignature className="h-5 w-5" /> Accept Terms
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><KuduLoader /></div>}><QuoteBoardContent /></Suspense>;
}