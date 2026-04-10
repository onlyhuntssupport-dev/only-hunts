"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, deleteDoc, addDoc } from "firebase/firestore";
import { 
  Target, CheckCircle, Clock, ChevronRight, 
  DollarSign, Users, Calendar, FileText, Check, MapPin, AlertCircle, ArrowRight, Trash2, ShieldCheck, PenTool, CreditCard, Lock, Loader2
} from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";

interface UnifiedQuote {
  id: string;
  sourceCollection: "quote_requests" | "quotes";
  outfitterId: string;
  outfitterName?: string;
  status: string;
  createdAt: number;
  targetSpecies: string | string[];
  logistics?: { days: number; hunters: number; observers?: number; startDate?: string; endDate?: string; province?: string; };
  notes?: string;
  totalAmount?: number;
  responseMessage?: string;
  financials?: any;
  huntId?: string;
  huntTitle?: string;
  packageId?: string;
  legal?: { agreedToTerms: boolean; signature: string; signedAt: string; };
}

function HunterQuoteBoard() {
  const [quotes, setQuotes] = useState<UnifiedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<UnifiedQuote | null>(null);
  
  const [isAccepting, setIsAccepting] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [digitalSignature, setDigitalSignature] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    setAgreeToTerms(false);
    setDigitalSignature("");
    setShowCheckout(false);
    setIsProcessingPayment(false);
  }, [selectedQuote?.id]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        let mergedQuotes: UnifiedQuote[] = [];

        const reqQuery = query(collection(db, "quote_requests"), where("hunterId", "==", user.uid));
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

        const autoQuery = query(collection(db, "quotes"), where("hunterId", "==", user.uid));
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

        const strictlyCustomQuotes = mergedQuotes.filter(quote => 
          !quote.huntId && !quote.huntTitle && !quote.packageId
        );

        strictlyCustomQuotes.sort((a, b) => b.createdAt - a.createdAt);
        setQuotes(strictlyCustomQuotes);
        if (strictlyCustomQuotes.length > 0) setSelectedQuote(strictlyCustomQuotes[0]);
        
      } catch (error) {
        console.error("Error fetching hunter quotes:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleProceedToCheckout = () => {
    if (!agreeToTerms || !digitalSignature.trim()) return;
    setShowCheckout(true);
  };

  const handleMockPayment = async () => {
    if (!selectedQuote || !selectedQuote.totalAmount) return;

    setIsProcessingPayment(true);
    
    // Simulate Paystack loading delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const quoteRef = doc(db, selectedQuote.sourceCollection, selectedQuote.id);
      
      const totalAmount = selectedQuote.totalAmount;
      const depositPaid = totalAmount * 0.30; 
      const platformFee = totalAmount * 0.10; 
      const outfitterPayout = depositPaid - platformFee;
      const balanceDue = totalAmount - depositPaid;

      const updateData = {
        status: "ACCEPTED",
        hunterAcceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        legal: {
          agreedToTerms: true,
          signature: digitalSignature.trim(),
          signedAt: new Date().toISOString()
        },
        financials: {
          totalUsd: totalAmount,
          depositPaidUsd: depositPaid,
          platformFeeUsd: platformFee,
          outfitterPayoutUsd: outfitterPayout,
          balanceDueUsd: balanceDue,
          paymentStatus: "DEPOSIT_PAID",
          transactionId: `MOCK_TXN_${Math.floor(Math.random() * 1000000)}`
        }
      };

      await setDoc(quoteRef, updateData, { merge: true });

      // FIRE THE REAL-TIME NOTIFICATION TO THE OUTFITTER
      await addDoc(collection(db, "notifications"), {
        userId: selectedQuote.outfitterId,
        title: "Deposit Paid & Dates Locked!",
        message: `${digitalSignature.trim()} signed the agreement and paid the $${depositPaid.toLocaleString()} deposit.`,
        type: "SUCCESS",
        link: "/outfitter/dashboard/custom-quotes?tab=accepted",
        read: false,
        createdAt: serverTimestamp()
      });

      setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, ...updateData } : q));
      setSelectedQuote({ ...selectedQuote, ...updateData });

      alert("Payment Successful! Your safari dates are officially locked in.");

    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDeleteQuote = async () => {
    if (!selectedQuote) return;
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this request?");
    if (!confirmDelete) return;

    try {
      const quoteRef = doc(db, selectedQuote.sourceCollection, selectedQuote.id);
      await deleteDoc(quoteRef);

      const updatedQuotes = quotes.filter(q => q.id !== selectedQuote.id);
      setQuotes(updatedQuotes);
      setSelectedQuote(updatedQuotes.length > 0 ? updatedQuotes[0] : null);
    } catch (error) {
      console.error("Error deleting quote:", error);
      alert("Failed to delete the request. Please try again.");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-off-white dark:bg-stone-950"><KuduLoader /></div>;

  if (quotes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-white dark:bg-stone-900 border-2 border-dashed border-kalahari/30 rounded-3xl p-12 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-kalahari/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <FileText className="h-16 w-16 text-kalahari/40 mx-auto mb-4 relative z-10" />
          <h2 className="text-3xl font-black font-headline text-olive dark:text-off-white mb-2 relative z-10 uppercase tracking-tight">
            Custom Safari Inbox
          </h2>
          <p className="text-olive/70 dark:text-off-white/60 font-medium max-w-lg mx-auto mb-8 relative z-10 leading-relaxed">
            This inbox is reserved for bespoke quotes drafted exclusively for you. 
          </p>
          <Link href="/outfitters" className="inline-flex items-center justify-center bg-kalahari hover:bg-kalahari/90 text-white font-black px-8 py-4 rounded-xl shadow-lg transition-all hover:-translate-y-1 w-full sm:w-auto">
            Find an Outfitter <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black font-headline text-olive dark:text-off-white tracking-tight flex items-center gap-3">
          <Target className="h-8 w-8 text-kalahari" /> Custom Safari Inbox
        </h1>
        <p className="text-olive/70 dark:text-off-white/60 font-medium mt-2">Review quotes drafted exclusively for you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        <div className="lg:col-span-1 space-y-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pr-2">
          {quotes.map((q) => (
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
                <h3 className="font-black text-base text-olive dark:text-off-white line-clamp-1 pr-4">
                  {q.outfitterName || "Verified Outfitter"}
                </h3>
                {selectedQuote?.id === q.id && <ChevronRight className="h-5 w-5 text-kalahari shrink-0" />}
              </div>
              
              <div className="mb-3">
                {q.status === "PENDING_OUTFITTER_REVIEW" ? (
                  <span className="inline-flex items-center gap-1 bg-gray-500/10 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest"><Clock className="h-3 w-3" /> Awaiting Pricing</span>
                ) : q.status === "ACCEPTED" ? (
                  <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest"><CheckCircle className="h-3 w-3" /> Locked In</span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-kalahari/10 text-kalahari px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest"><AlertCircle className="h-3 w-3" /> Action Required</span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-3 flex-wrap">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-kalahari" /> {q.logistics?.days || '?'} Days</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-kalahari" /> {q.logistics?.hunters || '?'} Hunters</span>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedQuote && (
            <div className="bg-white dark:bg-stone-900 border border-kalahari/20 rounded-3xl overflow-hidden shadow-xl mb-12">
              
              <div className="bg-olive p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black font-headline mb-1 flex items-center gap-3">
                      {selectedQuote.outfitterName || "Verified Outfitter"}
                    </h2>
                    <p className="text-white/80 font-medium text-sm flex items-center gap-2">
                      Requested on {new Date(selectedQuote.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10 text-xs font-black uppercase tracking-widest text-center">
                      {selectedQuote.status === "PENDING_OUTFITTER_REVIEW" ? "Pending Review" : "Proposal Ready"}
                    </div>
                    <button onClick={handleDeleteQuote} className="bg-red-500/20 hover:bg-red-500/40 transition-colors backdrop-blur-sm p-2 rounded-lg border border-red-500/30 text-white" title="Delete Request">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-kalahari/5 border-b border-kalahari/10 p-4 px-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-x divide-kalahari/20">
                <div>
                  <p className="text-[10px] font-black text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><Calendar className="h-3 w-3" /> Dates</p>
                  <p className="font-bold text-olive dark:text-white text-sm">{selectedQuote.logistics?.startDate ? `${formatDate(selectedQuote.logistics.startDate)} to ${formatDate(selectedQuote.logistics.endDate)}` : 'Flexible / Not Selected'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><MapPin className="h-3 w-3" /> Location</p>
                  <p className="font-bold text-olive dark:text-white text-sm">{selectedQuote.logistics?.province || 'Any / Undecided'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><Clock className="h-3 w-3" /> Duration</p>
                  <p className="font-bold text-olive dark:text-white text-sm">{selectedQuote.logistics?.days || '?'} Days</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><Users className="h-3 w-3" /> Group</p>
                  <p className="font-bold text-olive dark:text-white text-sm">{selectedQuote.logistics?.hunters || 0}H / {selectedQuote.logistics?.observers || 0}O</p>
                </div>
              </div>

              <div className="p-8">
                
                {selectedQuote.status === "PENDING_OUTFITTER_REVIEW" && (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-kalahari/50 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-xl font-black text-olive dark:text-off-white mb-2">Outfitter is Reviewing</h3>
                    <p className="text-sm font-medium text-olive/70 dark:text-off-white/60 max-w-sm mx-auto">
                      The outfitter is checking their calendar and building your custom pricing matrix. You will receive an email as soon as the quote is ready.
                    </p>
                  </div>
                )}

                {(selectedQuote.status === "QUOTE_PROVIDED" || selectedQuote.status === "PENDING_HUNTER_ACCEPTANCE" || selectedQuote.status === "ACCEPTED") && (
                  <div className="space-y-8">
                    
                    <div className="bg-orange-50 dark:bg-orange-950/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-900/50 flex flex-col sm:flex-row justify-between items-center gap-6">
                      <div>
                        <p className="text-xs font-black text-orange-800/60 dark:text-orange-400/60 uppercase tracking-widest mb-1">Total Quoted Price</p>
                        <p className="text-4xl font-black text-orange-900 dark:text-orange-400">
                          ${selectedQuote.totalAmount?.toLocaleString() || selectedQuote.financials?.totalUsd?.toLocaleString() || "N/A"}
                        </p>
                      </div>
                      {selectedQuote.status === "ACCEPTED" && (
                        <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-6 py-3 rounded-xl font-black flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" /> Secured & Paid
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-olive/50 dark:text-off-white/40 uppercase tracking-widest mb-3">Outfitter's Proposal & Inclusions</h4>
                      <div className="bg-gray-50 dark:bg-stone-950 p-6 rounded-xl border border-kalahari/10 text-olive dark:text-off-white/80 font-medium whitespace-pre-wrap leading-relaxed">
                        {selectedQuote.responseMessage || "No additional notes provided by outfitter."}
                      </div>
                    </div>

                    {(selectedQuote.status === "QUOTE_PROVIDED" || selectedQuote.status === "PENDING_HUNTER_ACCEPTANCE") && selectedQuote.totalAmount && (
                      <div className="bg-white dark:bg-black/20 p-6 rounded-2xl border-2 border-kalahari/30 mt-8 shadow-sm transition-all duration-500">
                        
                        {!showCheckout ? (
                          <div className="animate-in fade-in">
                            <h4 className="text-lg font-black text-olive dark:text-off-white flex items-center gap-2 mb-4">
                              <ShieldCheck className="h-5 w-5 text-kalahari" /> Step 1: Safari Agreement & Policy
                            </h4>
                            
                            <div className="bg-gray-50 dark:bg-stone-950 border border-kalahari/10 rounded-xl p-4 h-40 overflow-y-auto custom-scrollbar text-xs font-medium text-olive/80 dark:text-off-white/70 mb-6 leading-relaxed space-y-3">
                              <p className="font-bold">1. Wounded Game Policy</p>
                              <p>Any animal wounded or shot at and drawing blood, but not recovered, will be deemed hunted. Full trophy fees will apply.</p>
                              
                              <p className="font-bold">2. Payment & Deposit</p>
                              <p>A 30% deposit is required via our secure Paystack integration to lock your dates. The remaining balance will be settled directly with the outfitter prior to or upon arrival.</p>
                              
                              <p className="font-bold">3. Cancellations & Indemnity</p>
                              <p>Deposits are generally non-refundable unless dates can be re-booked. The client assumes all inherent risks associated with hunting.</p>
                            </div>

                            <div className="space-y-4">
                              <label className="flex items-start gap-3 cursor-pointer group">
                                <input 
                                  type="checkbox" 
                                  checked={agreeToTerms}
                                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                                  className="mt-1 w-5 h-5 text-kalahari rounded border-gray-300 focus:ring-kalahari cursor-pointer"
                                />
                                <span className="text-sm font-medium text-olive dark:text-off-white group-hover:text-kalahari transition-colors">
                                  I agree to the outfitter's proposal, pricing, and the standard Wounded Game Policy.
                                </span>
                              </label>

                              <div className="relative">
                                <PenTool className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input 
                                  type="text" 
                                  value={digitalSignature}
                                  onChange={(e) => setDigitalSignature(e.target.value)}
                                  placeholder="Type your full legal name to digitally sign"
                                  className="w-full bg-gray-50 dark:bg-stone-900 border border-gray-200 dark:border-stone-700 rounded-xl py-3 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-kalahari"
                                />
                              </div>

                              <button 
                                onClick={handleProceedToCheckout}
                                disabled={!agreeToTerms || !digitalSignature.trim()}
                                className="w-full mt-4 bg-olive hover:bg-olive/90 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                Proceed to Deposit Checkout <ArrowRight className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="animate-in slide-in-from-right-8">
                            <h4 className="text-lg font-black text-olive dark:text-off-white flex items-center gap-2 mb-4 border-b border-kalahari/20 pb-4">
                              <CreditCard className="h-5 w-5 text-kalahari" /> Step 2: Secure Deposit Payment
                            </h4>
                            
                            <div className="bg-gray-50 dark:bg-stone-950 rounded-xl p-6 mb-6 space-y-4 font-medium text-sm">
                              <div className="flex justify-between text-olive/70 dark:text-off-white/60">
                                <span>Total Safari Cost</span>
                                <span>${selectedQuote.totalAmount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-orange-600 dark:text-orange-400 font-bold border-b border-gray-200 dark:border-stone-800 pb-4">
                                <span>Required 30% Deposit (Due Now)</span>
                                <span>${(selectedQuote.totalAmount * 0.30).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-olive dark:text-white font-black text-lg pt-2">
                                <span>Balance Due in Camp</span>
                                <span>${(selectedQuote.totalAmount * 0.70).toLocaleString()}</span>
                              </div>
                            </div>

                            <button 
                              onClick={handleMockPayment}
                              disabled={isProcessingPayment}
                              className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {isProcessingPayment ? (
                                <><Loader2 className="h-5 w-5 animate-spin" /> Processing Securely...</>
                              ) : (
                                <><Lock className="h-5 w-5" /> Pay ${(selectedQuote.totalAmount * 0.30).toLocaleString()} Deposit (Mock)</>
                              )}
                            </button>
                            <p className="text-center text-xs font-bold text-olive/40 dark:text-white/30 mt-4 uppercase tracking-widest">
                              Secured by Paystack
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedQuote.status === "ACCEPTED" && selectedQuote.legal && selectedQuote.financials && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-kalahari/5 p-6 rounded-2xl border border-kalahari/20">
                          <h4 className="text-xs font-black text-olive/50 dark:text-off-white/40 uppercase tracking-widest mb-3">Digital Signature</h4>
                          <div className="bg-white dark:bg-stone-900 p-3 rounded-lg border border-kalahari/20 font-serif text-lg italic text-olive dark:text-white mb-2">
                            {selectedQuote.legal.signature}
                          </div>
                          <div className="text-[10px] font-bold text-olive/50 dark:text-off-white/40">
                            Signed: {new Date(selectedQuote.legal.signedAt).toLocaleString()}
                          </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-2xl border border-green-200 dark:border-green-900/30">
                          <h4 className="text-xs font-black text-green-800/60 dark:text-green-400/60 uppercase tracking-widest mb-3">Payment Record</h4>
                          <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-1">
                            Deposit Paid: <span className="font-black">${selectedQuote.financials.depositPaidUsd.toLocaleString()}</span>
                          </p>
                          <p className="text-sm font-medium text-olive/70 dark:text-off-white/60 mb-2">
                            Balance Due Later: <span className="font-bold">${selectedQuote.financials.balanceDueUsd.toLocaleString()}</span>
                          </p>
                          <div className="text-[10px] font-mono font-bold text-green-800/50 dark:text-green-400/50 uppercase break-all">
                            TXN: {selectedQuote.financials.transactionId}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
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
      <HunterQuoteBoard />
    </Suspense>
  );
}