"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { 
  Users, Calendar, Target, DollarSign, MessageSquare, 
  Clock, CheckCircle, XCircle, ChevronRight, Send, AlertCircle
} from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";

export default function OutfitterLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  
  // Form State for generating the quote
  const [quoteAmount, setQuoteAmount] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [validDays, setValidDays] = useState("7");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchLeads = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const q = query(
          collection(db, "quote_requests"),
          where("outfitterId", "==", user.uid)
        );
        
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Client-side sort (newest first)
        // OVERRIDE: Cast to any to bypass strict type checking on createdAt
        fetched.sort((a: any, b: any) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;
          return dateB - dateA;
        });

        setLeads(fetched);
        if (fetched.length > 0) setSelectedLead(fetched[0]);
      } catch (error) {
        console.error("Error fetching leads:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => fetchLeads(), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !quoteAmount) return;

    setIsSubmitting(true);
    
    try {
      // Calculate expiration date
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(validDays));

      const updateData = {
        totalAmount: parseFloat(quoteAmount),
        responseMessage: responseMessage,
        validUntil: expirationDate.toISOString(),
        status: "QUOTE_PROVIDED",
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, "quote_requests", selectedLead.id), updateData);
      
      // Update local state
      const updatedLead = { ...selectedLead, ...updateData };
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? updatedLead : l));
      setSelectedLead(updatedLead);
      
      // Reset form
      setQuoteAmount("");
      setResponseMessage("");
      
    } catch (error) {
      console.error("Error sending quote:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_OUTFITTER_REVIEW":
        return <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit"><AlertCircle className="h-3 w-3" /> New Lead</span>;
      case "QUOTE_PROVIDED":
        return <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit"><Clock className="h-3 w-3" /> Quote Sent</span>;
      case "ACCEPTED":
        return <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800/50 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit"><CheckCircle className="h-3 w-3" /> Won / Accepted</span>;
      case "DECLINED":
        return <span className="bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-stone-700 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit"><XCircle className="h-3 w-3" /> Lost / Declined</span>;
      default:
        return null;
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><KuduLoader /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 transition-colors duration-300">
      
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black font-headline text-olive dark:text-off-white tracking-tight">Lead Management</h1>
        <p className="text-olive/70 dark:text-off-white/60 font-medium mt-2">Respond to custom quote requests from hunters.</p>
      </div>

      {leads.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 border border-kalahari/20 rounded-3xl p-12 text-center shadow-sm">
          <Users className="h-16 w-16 text-kalahari/40 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-olive dark:text-off-white mb-2">No Leads Yet</h2>
          <p className="text-olive/70 dark:text-off-white/60 font-medium max-w-md mx-auto">When hunters request custom quotes from your storefront, they will appear here for you to price and review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT: INBOX LIST */}
          <div className="lg:col-span-1 space-y-3 h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {leads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                  selectedLead?.id === lead.id 
                    ? "bg-white dark:bg-stone-900 border-kalahari shadow-md" 
                    : "bg-white/50 dark:bg-stone-900/50 border-kalahari/10 hover:border-kalahari/30"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black font-headline text-olive dark:text-off-white text-lg line-clamp-1 pr-4">{lead.hunterName}</h3>
                  {selectedLead?.id === lead.id && <ChevronRight className="h-5 w-5 text-kalahari shrink-0" />}
                </div>
                {getStatusBadge(lead.status)}
                <div className="mt-4 text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase tracking-widest line-clamp-1">
                  Target: {lead.targetSpecies}
                </div>
              </button>
            ))}
          </div>

          {/* RIGHT: DETAILS & ACTION DESK */}
          <div className="lg:col-span-2">
            {selectedLead ? (
              <div className="bg-white dark:bg-stone-900 border border-kalahari/20 rounded-3xl overflow-hidden shadow-lg">
                
                {/* Header */}
                <div className="bg-olive p-6 md:p-8 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black font-headline text-kalahari mb-1">Lead: {selectedLead.hunterName}</h2>
                      <p className="text-off-white/80 font-medium text-sm flex items-center gap-2">
                        {selectedLead.hunterEmail}
                      </p>
                    </div>
                    <div>{getStatusBadge(selectedLead.status)}</div>
                  </div>
                </div>

                {/* Logistics Bar */}
                <div className="bg-kalahari/10 border-b border-kalahari/20 p-4 px-6 md:px-8 grid grid-cols-3 gap-4 text-center divide-x divide-kalahari/20">
                  <div>
                    <p className="text-[10px] font-black text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-1">Duration</p>
                    <p className="font-bold text-olive dark:text-white flex items-center justify-center gap-1.5"><Calendar className="h-4 w-4 text-kalahari" /> {selectedLead.logistics?.days} Days</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-1">Group Size</p>
                    <p className="font-bold text-olive dark:text-white flex items-center justify-center gap-1.5">
                      <Users className="h-4 w-4 text-kalahari" /> {selectedLead.logistics?.hunters}H / {selectedLead.logistics?.observers || 0}O
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-1">Target</p>
                    <p className="font-bold text-olive dark:text-white flex items-center justify-center gap-1.5 line-clamp-1"><Target className="h-4 w-4 text-kalahari" /> {selectedLead.targetSpecies}</p>
                  </div>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                  
                  {/* Hunter's Message */}
                  {selectedLead.message && (
                    <div>
                      <h4 className="text-xs font-black text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-3">Hunter's Notes</h4>
                      <div className="bg-off-white dark:bg-stone-950 p-5 rounded-xl border border-kalahari/20 text-olive dark:text-off-white/80 font-medium whitespace-pre-wrap">
                        {selectedLead.message}
                      </div>
                    </div>
                  )}

                  {/* ACTION DESK (Generate Quote or View Sent Quote) */}
                  {selectedLead.status === "PENDING_OUTFITTER_REVIEW" ? (
                    <div className="bg-orange-50 dark:bg-orange-950/20 rounded-2xl p-6 md:p-8 border border-orange-200 dark:border-orange-900/50">
                      <h3 className="text-xl font-black font-headline text-orange-900 dark:text-orange-400 mb-6 flex items-center gap-2">
                        <DollarSign className="h-5 w-5" /> Generate Custom Quote
                      </h3>
                      
                      <form onSubmit={handleSendQuote} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-orange-900/70 dark:text-orange-400/70 uppercase tracking-widest mb-2">Total Price ($)</label>
                            <input 
                              type="number" 
                              required
                              value={quoteAmount}
                              onChange={(e) => setQuoteAmount(e.target.value)}
                              className="w-full bg-white dark:bg-stone-900 border border-orange-200 dark:border-orange-800 rounded-xl p-3.5 text-orange-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 font-black text-lg"
                              placeholder="e.g. 5500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-orange-900/70 dark:text-orange-400/70 uppercase tracking-widest mb-2">Quote Valid For</label>
                            <select 
                              value={validDays}
                              onChange={(e) => setValidDays(e.target.value)}
                              className="w-full bg-white dark:bg-stone-900 border border-orange-200 dark:border-orange-800 rounded-xl p-3.5 text-orange-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 font-bold appearance-none"
                            >
                              <option value="3">3 Days</option>
                              <option value="7">7 Days</option>
                              <option value="14">14 Days</option>
                              <option value="30">30 Days</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-orange-900/70 dark:text-orange-400/70 uppercase tracking-widest mb-2">Message to Hunter</label>
                          <textarea 
                            required
                            value={responseMessage}
                            onChange={(e) => setResponseMessage(e.target.value)}
                            className="w-full h-32 bg-white dark:bg-stone-900 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-orange-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 font-medium resize-none"
                            placeholder="Detail what is included (daily rates, trophy fees, accommodation) and why they should book with you..."
                          />
                        </div>

                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 text-lg"
                        >
                          {isSubmitting ? "Sending Quote..." : <><Send className="h-5 w-5" /> Send Quote to Hunter</>}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-off-white dark:bg-stone-950 rounded-2xl p-6 md:p-8 border border-kalahari/20">
                      <h3 className="text-sm font-black text-olive/50 dark:text-off-white/40 uppercase tracking-widest mb-6">Quote Details Provided</h3>
                      
                      <div className="flex items-end gap-2 mb-6">
                        <DollarSign className="h-8 w-8 text-kalahari mb-1" />
                        <span className="text-4xl font-black font-headline text-olive dark:text-white tracking-tight">
                          {selectedLead.totalAmount?.toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-kalahari/10 text-olive dark:text-off-white/80 font-medium whitespace-pre-wrap italic mb-4">
                        "{selectedLead.responseMessage}"
                      </div>
                      
                      <p className="text-xs font-bold text-olive/50 dark:text-off-white/40 uppercase tracking-widest">
                        Valid Until: {selectedLead.validUntil ? new Date(selectedLead.validUntil).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-olive/40 dark:text-off-white/30 font-bold border-2 border-dashed border-kalahari/20 rounded-3xl p-12">
                Select a lead to view details
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}