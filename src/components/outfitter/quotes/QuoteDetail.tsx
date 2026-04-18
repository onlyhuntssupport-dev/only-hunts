import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/client";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Target, CheckCircle, Clock, DollarSign, Users, Calendar, Send, Check, Calculator, Archive, ArchiveRestore, Trash2, MapPin } from "lucide-react";
import { UnifiedQuote, OutfitterRates } from "@/types/quotes";

const STANDARD_INCLUSIONS = ["Professional Hunter (PH)", "Field Prep of Trophies", "Lodging & Meals", "Local Beer & Wine", "Airport Transfer", "Daily Laundry", "Hunting Vehicle"];
const STANDARD_EXCLUSIONS = ["Taxidermy", "Dipping & Shipping", "Hard Liquor", "International Flights", "Gratuities", "Pre/Post Safari Accommodation"];

interface QuoteDetailProps {
  quote: UnifiedQuote;
  activeTab: string;
  outfitterRates: OutfitterRates | null;
  onUpdate: (updatedQuote: UnifiedQuote) => void;
  onDelete: (id: string) => void;
  onOpenCalendar: () => void;
}

export default function QuoteDetail({ quote, activeTab, outfitterRates, onUpdate, onDelete, onOpenCalendar }: QuoteDetailProps) {
  const [autoCalculatedTotal, setAutoCalculatedTotal] = useState<number>(0);
  const [replyPrice, setReplyPrice] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [selectedInclusions, setSelectedInclusions] = useState<string[]>([]);
  const [selectedExclusions, setSelectedExclusions] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (quote.status === "PENDING_OUTFITTER_REVIEW" && outfitterRates) {
      let total = (quote.logistics?.days || 0) * (quote.logistics?.hunters || 0) * outfitterRates.dailyRate;
      const speciesArray = Array.isArray(quote.targetSpecies) ? quote.targetSpecies : [quote.targetSpecies];
      speciesArray.forEach(sp => { if (outfitterRates.trophyFees[sp]) total += outfitterRates.trophyFees[sp]; });
      setAutoCalculatedTotal(total);
      setReplyPrice(total > 0 ? total.toString() : "");
    } else {
      setReplyPrice(""); setAutoCalculatedTotal(0);
    }
    setReplyMessage(""); setSelectedInclusions([]); setSelectedExclusions([]);
  }, [quote, outfitterRates]);

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyPrice) return;
    setIsSending(true);
    try {
      let compiledMessage = "";
      if (selectedInclusions.length > 0) compiledMessage += `✓ INCLUDED:\n• ${selectedInclusions.join('\n• ')}\n\n`;
      if (selectedExclusions.length > 0) compiledMessage += `✗ EXCLUDED:\n• ${selectedExclusions.join('\n• ')}\n\n`;
      if (replyMessage.trim()) compiledMessage += `ADDITIONAL NOTES:\n${replyMessage.trim()}`;
      if (!compiledMessage.trim()) compiledMessage = "Custom quote details provided.";
      
      const updateData = {
        status: "QUOTE_PROVIDED", totalAmount: parseFloat(replyPrice), responseMessage: compiledMessage,
        includedItems: selectedInclusions, excludedItems: selectedExclusions, updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, quote.sourceCollection, quote.id), updateData, { merge: true });
      onUpdate({ ...quote, ...updateData });
    } catch (error) { alert("Failed to send quote."); } finally { setIsSending(false); }
  };

  const handleToggleArchive = async (toArchive: boolean) => {
    if (toArchive && !window.confirm("Archive this quote?")) return;
    await setDoc(doc(db, quote.sourceCollection, quote.id), { outfitterArchived: toArchive }, { merge: true });
    onUpdate({ ...quote, outfitterArchived: toArchive });
  };

  const handlePermanentDelete = async () => {
    if (!window.confirm("Permanently delete this quote?")) return;
    await deleteDoc(doc(db, quote.sourceCollection, quote.id));
    onDelete(quote.id);
  };

  const formatDate = (ds?: string) => ds ? new Date(ds).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;

  return (
    <div className="bg-white dark:bg-stone-900 border border-kalahari/20 rounded-3xl overflow-hidden shadow-xl mb-12">
      <div className={`p-6 text-white relative overflow-hidden ${activeTab === 'pending' ? 'bg-orange-600' : activeTab === 'accepted' ? 'bg-green-600' : activeTab === 'archived' ? 'bg-gray-600' : 'bg-olive'}`}>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black font-headline mb-1 flex items-center gap-3">
              {quote.hunterName || "Registered Hunter"}
              {quote.outfitterArchived && <span className="bg-white/20 text-white text-[10px] uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1"><Archive className="h-3 w-3" /> Archived</span>}
            </h2>
            <p className="text-white/80 font-medium text-sm flex items-center gap-2">Requested on {new Date(quote.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-2">
            {!quote.outfitterArchived ? (
              <button onClick={() => handleToggleArchive(true)} className="bg-black/20 hover:bg-black/40 px-4 py-2 rounded-lg border border-white/10 text-xs font-black uppercase"><Archive className="h-4 w-4 inline mr-1" /> Archive</button>
            ) : (
              <>
                <button onClick={() => handleToggleArchive(false)} className="bg-white/20 px-4 py-2 rounded-lg border border-white/20 text-xs font-black uppercase"><ArchiveRestore className="h-4 w-4 inline mr-1" /> Restore</button>
                <button onClick={handlePermanentDelete} className="bg-red-500/20 px-4 py-2 rounded-lg border border-red-500/30 text-xs font-black uppercase"><Trash2 className="h-4 w-4 inline mr-1" /> Delete</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-kalahari/5 border-b border-kalahari/10 p-4 px-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-x divide-kalahari/20">
        <div className="flex flex-col items-center justify-center">
          <p className="text-[10px] font-black text-olive/60 uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><Calendar className="h-3 w-3" /> Dates</p>
          <p className="font-bold text-sm">{quote.logistics?.startDate && quote.logistics?.endDate ? `${formatDate(quote.logistics.startDate)} to ${formatDate(quote.logistics.endDate)}` : 'Flexible'}</p>
          {quote.logistics?.startDate && <button onClick={onOpenCalendar} className="mt-1.5 text-[10px] bg-kalahari/10 text-kalahari uppercase font-black px-2 py-1 rounded">Check Calendar</button>}
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="text-[10px] font-black text-olive/60 uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><MapPin className="h-3 w-3" /> Location</p>
          <p className="font-bold text-sm">{quote.logistics?.province || 'Any'}</p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="text-[10px] font-black text-olive/60 uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><Clock className="h-3 w-3" /> Duration</p>
          <p className="font-bold text-sm">{quote.logistics?.days || '?'} Days</p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="text-[10px] font-black text-olive/60 uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><Users className="h-3 w-3" /> Group</p>
          <p className="font-bold text-sm">{quote.logistics?.hunters || 0}H / {quote.logistics?.observers || 0}O</p>
        </div>
      </div>

      <div className="p-8">
        {quote.notes && (
          <div className="mb-8">
            <h4 className="text-xs font-black text-olive/50 uppercase tracking-widest mb-3">Hunter&apos;s Notes</h4>
            <div className="bg-gray-50 dark:bg-stone-950 p-5 rounded-xl border border-kalahari/10 font-medium italic">&quot;{quote.notes}&quot;</div>
          </div>
        )}

        {activeTab === 'pending' && !quote.outfitterArchived && (
          <form onSubmit={handleSendQuote} className="bg-orange-50 dark:bg-orange-950/20 rounded-2xl p-6 border border-orange-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-orange-900 flex items-center gap-2"><DollarSign className="h-5 w-5" /> Build Pricing Proposal</h3>
              {autoCalculatedTotal > 0 && <span className="text-[10px] font-black uppercase bg-orange-200 text-orange-800 px-2 py-1 rounded flex items-center gap-1"><Calculator className="h-3 w-3" /> System Auto-Priced</span>}
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-orange-800/60 uppercase tracking-widest mb-2">Total Price (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="number" required min="1" value={replyPrice} onChange={(e) => setReplyPrice(e.target.value)} className="w-full border border-orange-200 rounded-xl py-4 pl-12 pr-4 text-xl font-black outline-none focus:ring-2 focus:ring-orange-500" placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/50 p-6 rounded-xl border border-orange-200">
                <div>
                  <p className="text-xs font-black text-green-700 uppercase tracking-widest mb-4 border-b border-green-200 pb-2">Included</p>
                  {STANDARD_INCLUSIONS.map(item => (
                    <label key={item} className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" checked={selectedInclusions.includes(item)} onChange={() => setSelectedInclusions(p => p.includes(item) ? p.filter(i => i !== item) : [...p, item])} className="w-4 h-4 text-green-600 rounded" />
                      <span className="text-sm font-medium">{item}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-black text-red-700 uppercase tracking-widest mb-4 border-b border-red-200 pb-2">Excluded</p>
                  {STANDARD_EXCLUSIONS.map(item => (
                    <label key={item} className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" checked={selectedExclusions.includes(item)} onChange={() => setSelectedExclusions(p => p.includes(item) ? p.filter(i => i !== item) : [...p, item])} className="w-4 h-4 text-red-600 rounded" />
                      <span className="text-sm font-medium">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 border-t border-orange-200 pt-6">
                <p className="text-xs font-black text-orange-800/80 uppercase tracking-widest mb-3 flex items-center gap-2"><Target className="h-4 w-4"/> Target Species</p>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(quote.targetSpecies) ? quote.targetSpecies : [quote.targetSpecies]).map(ts => (
                    <span key={ts} className="bg-orange-100 text-orange-800 px-3 py-1.5 rounded-lg text-sm font-bold border border-orange-200">{ts}</span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-orange-800/60 uppercase tracking-widest mb-2">Additional Notes (Optional)</label>
                <textarea value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} className="w-full h-24 border border-orange-200 rounded-xl p-4 text-sm font-medium resize-none outline-none focus:ring-2 focus:ring-orange-500" placeholder="Confirm dates or add welcome messages..." />
              </div>

              <button type="submit" disabled={isSending || !replyPrice} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {isSending ? "Compiling..." : <><Send className="h-5 w-5" /> Compile & Send Quote</>}
              </button>
            </div>
          </form>
        )}

        {((activeTab === 'waiting' || activeTab === 'accepted' || activeTab === 'archived') && quote.status !== "PENDING_OUTFITTER_REVIEW") && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-xl flex justify-between items-center border border-kalahari/10">
              <div>
                <p className="text-xs font-black text-olive/50 uppercase tracking-widest mb-1">Quoted Price</p>
                <p className="text-3xl font-black">${quote.totalAmount?.toLocaleString() || quote.financials?.totalUsd?.toLocaleString() || "N/A"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-olive/50 uppercase tracking-widest mb-1">Status</p>
                {quote.status === "QUOTE_PROVIDED" || quote.status === "PENDING_HUNTER_ACCEPTANCE" ? (
                  <span className="inline-flex bg-kalahari/10 text-kalahari px-3 py-1.5 rounded-lg text-sm font-bold"><Clock className="h-4 w-4 mr-1" /> Awaiting Signature</span>
                ) : quote.status === "ACCEPTED" ? (
                  <span className="inline-flex bg-green-500/10 text-green-500 px-3 py-1.5 rounded-lg text-sm font-bold"><Check className="h-4 w-4 mr-1" /> Locked & Signed</span>
                ) : (
                  <span className="inline-flex bg-gray-500/10 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-bold">{quote.status.replace(/_/g, ' ')}</span>
                )}
              </div>
            </div>

            <div className="border border-kalahari/20 rounded-xl p-6">
              <p className="text-xs font-black text-olive/50 uppercase tracking-widest mb-4">Sent Proposal Details</p>
              <div className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                {quote.responseMessage || "No message provided."}
                <div className="mt-6 pt-4 border-t border-kalahari/10">
                  <p className="text-xs font-black text-kalahari uppercase tracking-widest mb-3 flex items-center gap-2"><Target className="h-4 w-4"/> Target Species</p>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(quote.targetSpecies) ? quote.targetSpecies : [quote.targetSpecies]).map(ts => (
                      <span key={ts} className="bg-kalahari/10 px-3 py-1.5 rounded-lg text-sm font-bold border border-kalahari/20">{ts}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {quote.status === 'ACCEPTED' && (
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <div className="flex flex-col items-center text-center mb-6">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                  <h3 className="text-xl font-black text-green-900">Booking Confirmed & Secured</h3>
                </div>
                <div className="bg-white/60 p-4 rounded-lg text-sm font-medium text-green-900">
                  <ul className="space-y-2 text-left list-disc list-inside">
                    <li><strong>Commission Settled:</strong> Platform fees deducted via Paystack.</li>
                    <li><strong>Payout Routed:</strong> Net deposit transferred to your linked account.</li>
                    <li><strong>Outstanding Balance:</strong> Collect remaining balance directly from client.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}