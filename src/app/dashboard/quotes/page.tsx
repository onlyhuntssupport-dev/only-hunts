"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { 
  FileText, Clock, CheckCircle, XCircle, ChevronRight, 
  Calendar, Users, Target, DollarSign, MessageSquare, AlertCircle, ShieldCheck
} from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";
import Link from "next/link";

export default function HunterQuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [paymentInstructions, setPaymentInstructions] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuotes = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const q = query(
          collection(db, "quote_requests"),
          where("hunterId", "==", user.uid)
        );
        
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // OVERRIDE: Cast to any to bypass strict type checking on createdAt
        fetched.sort((a: any, b: any) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;
          return dateB - dateA;
        });

        setQuotes(fetched);
        if (fetched.length > 0) setSelectedQuote(fetched[0]);
      } catch (error) {
        console.error("Error fetching quotes:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => fetchQuotes(), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchInstructions = async () => {
      if (selectedQuote?.status === "ACCEPTED" && selectedQuote?.outfitterId) {
        try {
          const outfitterDoc = await getDoc(doc(db, "outfitters", selectedQuote.outfitterId));
          if (outfitterDoc.exists()) {
            setPaymentInstructions(
              outfitterDoc.data().paymentInstructions || 
              "The outfitter has not provided automated payment instructions. They will contact you via email shortly to arrange the deposit."
            );
          }
        } catch (error) {
          console.error("Error fetching payment info:", error);
        }
      } else {
        setPaymentInstructions(null);
      }
    };
    
    fetchInstructions();
  }, [selectedQuote]);

  const handleQuoteAction = async (quoteId: string, newStatus: "ACCEPTED" | "DECLINED") => {
    setActionLoading(true);
    try {
      await setDoc(doc(db, "quote_requests", quoteId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));
      if (selectedQuote?.id === quoteId) {
        setSelectedQuote({ ...selectedQuote, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating quote:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_OUTFITTER_REVIEW":
        return <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit"><Clock className="h-3 w-3" /> Awaiting Outfitter</span>;
      case "QUOTE_PROVIDED":
        return <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit"><AlertCircle className="h-3 w-3" /> Action Required</span>;
      case "ACCEPTED":
        return <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800/50 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit"><CheckCircle className="h-3 w-3" /> Accepted</span>;
      case "DECLINED":
        return <span className="bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-stone-700 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit"><XCircle className="h-3 w-3" /> Declined</span>;
      default:
        return null;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-off-white dark:bg-stone-950"><KuduLoader /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 transition-colors duration-300">
      
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black font-headline text-olive dark:text-off-white tracking-tight">My Custom Quotes</h1>
        <p className="text-olive/70 dark:text-off-white/60 font-medium mt-2">Review bespoke pricing and itineraries from verified outfitters.</p>
      </div>

      {quotes.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 border border-kalahari/20 rounded-3xl p-12 text-center shadow-sm">
          <FileText className="h-16 w-16 text-kalahari/40 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-olive dark:text-off-white mb-2">No Quotes Requested</h2>
          <p className="text-olive/70 dark:text-off-white/60 font-medium mb-6 max-w-md mx-auto">You haven't requested any custom quotes yet. Browse our verified outfitters and request a bespoke itinerary.</p>
          <Link href="/outfitters" className="inline-flex bg-kalahari hover:bg-kalahari/90 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md">
            Browse Outfitters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-1 space-y-3">
            {quotes.map((quote) => (
              <button
                key={quote.id}
                onClick={() => setSelectedQuote(quote)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                  selectedQuote?.id === quote.id 
                    ? "bg-white dark:bg-stone-900 border-kalahari shadow-md" 
                    : "bg-white/50 dark:bg-stone-900/50 border-kalahari/10 hover:border-kalahari/30"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black font-headline text-olive dark:text-off-white text-lg line-clamp-1 pr-4">{quote.outfitterName}</h3>
                  {selectedQuote?.id === quote.id && <ChevronRight className="h-5 w-5 text-kalahari shrink-0" />}
                </div>
                {getStatusBadge(quote.status)}
                <div className="mt-4 flex items-center gap-4 text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-kalahari" /> {quote.logistics?.days} Days</span>
                  <span className="flex items-center gap-1.5 line-clamp-1"><Target className="h-3.5 w-3.5 text-kalahari" /> {Array.isArray(quote.targetSpecies) ? quote.targetSpecies.join(", ") : quote.targetSpecies}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedQuote ? (
              <div className="bg-white dark:bg-stone-900 border border-kalahari/20 rounded-3xl overflow-hidden shadow-lg sticky top-24">
                
                <div className="bg-olive p-8 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black font-headline text-kalahari mb-1">{selectedQuote.outfitterName}</h2>
                      <p className="text-off-white/80 font-medium text-sm flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-kalahari" /> Verified Outfitter Quote
                      </p>
                    </div>
                    <div>{getStatusBadge(selectedQuote.status)}</div>
                  </div>
                </div>

                <div className="bg-kalahari/10 border-b border-kalahari/20 p-4 px-8 grid grid-cols-3 gap-4 text-center divide-x divide-kalahari/20">
                  <div>
                    <p className="text-[10px] font-black text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-1">Duration</p>
                    <p className="font-bold text-olive dark:text-white flex items-center justify-center gap-1.5"><Calendar className="h-4 w-4 text-kalahari" /> {selectedQuote.logistics?.days} Days</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-1">Hunters</p>
                    <p className="font-bold text-olive dark:text-white flex items-center justify-center gap-1.5"><Users className="h-4 w-4 text-kalahari" /> {selectedQuote.logistics?.hunters}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-1">Target</p>
                    <p className="font-bold text-olive dark:text-white flex items-center justify-center gap-1.5 line-clamp-1"><Target className="h-4 w-4 text-kalahari" /> {Array.isArray(selectedQuote.targetSpecies) ? selectedQuote.targetSpecies.join(", ") : selectedQuote.targetSpecies}</p>
                  </div>
                </div>

                <div className="p-8">
                  
                  {selectedQuote.status === "PENDING_OUTFITTER_REVIEW" ? (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-kalahari/50 mx-auto mb-4 animate-pulse" />
                      <h3 className="text-xl font-black text-olive dark:text-white mb-2">Outfitter is Preparing Your Quote</h3>
                      <p className="text-olive/70 dark:text-off-white/60 font-medium max-w-md mx-auto">
                        {selectedQuote.outfitterName} has received your request and is currently building your bespoke pricing matrix. You will be notified once it is ready.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {selectedQuote.responseMessage && (
                        <div>
                          <h4 className="text-xs font-black text-olive/50 dark:text-off-white/40 uppercase tracking-widest mb-3">Message from Outfitter</h4>
                          <div className="bg-off-white dark:bg-stone-950 p-5 rounded-xl border border-kalahari/10 text-olive dark:text-off-white/80 font-medium italic">
                            "{selectedQuote.responseMessage}"
                          </div>
                        </div>
                      )}

                      {selectedQuote.totalAmount && (
                        <div className="bg-orange-50 dark:bg-orange-950/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-900/50">
                          <h4 className="text-xs font-black text-orange-800/60 dark:text-orange-400/60 uppercase tracking-widest mb-4">Total Quote Amount</h4>
                          <div className="flex items-end gap-2">
                            <DollarSign className="h-10 w-10 text-orange-600 dark:text-orange-500 mb-1" />
                            <span className="text-5xl font-black font-headline text-orange-900 dark:text-orange-400 tracking-tight">
                              {selectedQuote.totalAmount.toLocaleString()}
                            </span>
                          </div>
                          {selectedQuote.validUntil && (
                            <p className="text-xs font-bold text-orange-800/60 dark:text-orange-400/60 mt-4">
                              Quote Valid Until: {new Date(selectedQuote.validUntil).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {selectedQuote.status === "QUOTE_PROVIDED" && (
                        <div className="pt-6 border-t border-kalahari/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <button 
                            onClick={() => handleQuoteAction(selectedQuote.id, "ACCEPTED")}
                            disabled={actionLoading}
                            className="bg-kalahari hover:bg-kalahari/90 text-white font-black py-4 rounded-xl shadow-md transition-all flex justify-center items-center disabled:opacity-50"
                          >
                            Accept & Lock Dates
                          </button>
                          <div className="grid grid-cols-2 gap-4">
                            <button className="border-2 border-kalahari text-kalahari hover:bg-kalahari/10 font-black py-4 rounded-xl transition-all flex justify-center items-center">
                              <MessageSquare className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => handleQuoteAction(selectedQuote.id, "DECLINED")}
                              disabled={actionLoading}
                              className="bg-stone-100 dark:bg-stone-800 text-olive dark:text-off-white hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 font-black py-4 rounded-xl transition-all disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedQuote.status === "ACCEPTED" && (
                        <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl p-6 md:p-8 border border-green-200 dark:border-green-900/50 mt-6 animate-in slide-in-from-bottom-4 duration-500">
                          <h3 className="text-xl font-black font-headline text-green-900 dark:text-green-400 mb-4 flex items-center gap-2">
                            <CheckCircle className="h-6 w-6" /> Dates Locked. Next Steps:
                          </h3>
                          <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-6">
                            To officially secure your dates, please transfer the required deposit using the outfitter's secure banking details below. Once the deposit clears, the outfitter will confirm your itinerary.
                          </p>
                          <div className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-green-200/50 dark:border-green-800/30 text-olive dark:text-off-white font-mono text-sm whitespace-pre-wrap shadow-inner">
                            {paymentInstructions === null ? (
                              <span className="animate-pulse">Loading secure instructions...</span>
                            ) : (
                              paymentInstructions
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-olive/40 dark:text-off-white/30 font-bold border-2 border-dashed border-kalahari/20 rounded-3xl p-12">
                Select a quote to view details
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}