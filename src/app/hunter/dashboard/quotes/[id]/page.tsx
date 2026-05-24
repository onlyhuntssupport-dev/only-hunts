'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore'; 
import { db, auth } from '@/lib/firebase/client';
import { initializeHuntBooking } from '@/app/actions/paystack';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface QuoteData {
  id: string;
  outfitterId: string;
  outfitterName: string;
  outfitterEmail: string;
  hunterId: string; // Enforces data isolation
  status: string;
  logistics: { days: number; hunters: number; observers: number };
  financials: { baseRateTotal: number; trophyFeeTotal: number; totalUsd: number; isVatInclusive: boolean };
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  terms: { includesAccommodation: boolean; includesMeals: boolean; woundedGamePolicyApplies: boolean };
  expiresAt?: string;
}

export default function HunterQuoteReviewPage({ params }: PageProps) {
  const { id } = React.use(params);
  const router = useRouter(); 
  
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signature, setSignature] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Live Sync Stream with Firestore
  useEffect(() => {
    if (!id) return;

    const quoteRef = doc(db, 'quotes', id);
    
    const unsubscribe = onSnapshot(quoteRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Security Checkpoint: Verify current user owns this quote resource
        if (auth.currentUser && data.hunterId !== auth.currentUser.uid) {
          setUnauthorized(true);
        } else {
          setQuote({ id: docSnap.id, ...data } as QuoteData);
        }
      } else {
        setQuote(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore real-time subscription sync failed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  // Handle Authentication State Shifts Securely
  useEffect(() => {
    if (!loading && quote && auth.currentUser) {
      if (quote.hunterId !== auth.currentUser.uid) {
        setUnauthorized(true);
      }
    }
  }, [loading, quote]);

  const handleAcceptQuote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth.currentUser?.email || !auth.currentUser?.uid || unauthorized) {
      alert("Unauthorized operational state. Access denied.");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Initialize Paystack Transaction Payload
      const depositPct = 30; 
      const depositDueUSD = quote!.financials.totalUsd * (depositPct / 100);
      const EXCHANGE_RATE = 19.00; // Aligned platform fallback margin rate
      const amountCentsZAR = depositDueUSD * EXCHANGE_RATE * 100;

      const res = await initializeHuntBooking(
        auth.currentUser.email,
        quote!.id, 
        quote!.outfitterId, 
        amountCentsZAR,
        quote!.financials.totalUsd,
        depositPct,
        auth.currentUser.uid, 
        `Safari Booking Deposit: ${quote!.outfitterName}` 
      );

      // 2. Client handoff directly out to Paystack Security Gateway Engine
      if (res.authorizationUrl) {
        window.location.href = res.authorizationUrl;
      } else {
        throw new Error("Invalid checkout redirect routing returned by gateway.");
      }
      
    } catch (error: any) {
      console.error("Critical gateway failure handling acceptance:", error);
      alert("An unexpected processing error occurred: " + error.message);
      setIsProcessing(false); 
    } 
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6 space-y-6 animate-pulse">
        <div className="h-10 w-2/3 bg-gray-800 rounded"></div>
        <div className="h-32 bg-gray-800 rounded"></div>
        <div className="h-64 bg-gray-800 rounded"></div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="mx-auto max-w-4xl p-10 text-center text-red-400 border border-red-900 rounded-lg bg-red-950/20 my-10">
        <h2 className="text-2xl font-bold mb-2">Access Violations Triggered</h2>
        <p className="text-gray-400">You are not authorized to evaluate this custom safari package pricing asset.</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="mx-auto max-w-4xl p-10 text-center text-gray-400 border border-gray-700 rounded-lg bg-gray-800/50 my-10">
        <h2 className="text-2xl font-bold mb-2">Proposal Defunct</h2>
        <p>The requested contract reference does not match an active record inside the system architecture.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 relative pb-24">
      
      {/* Header & Status Control Panels */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-700 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Custom Safari Proposal</h1>
          <p className="text-gray-400 mt-1">Prepared by <span className="font-semibold text-orange-500">{quote.outfitterName}</span></p>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold ${
            quote.status.includes('ACCEPTED') || quote.status === 'DEPOSIT_SECURED' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 
            quote.status === 'DECLINED' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 
            'bg-orange-500/20 text-orange-400 border border-orange-500/50'
          }`}>
            {quote.status.replace(/_/g, ' ')}
          </span>
          {quote.expiresAt && <p className="text-xs text-gray-500 mt-2">Valid until: {quote.expiresAt}</p>}
        </div>
      </div>

      {/* Logistics Configuration Grid */}
      <section className="mb-8 grid grid-cols-3 gap-4 rounded-lg bg-gray-800 p-6 shadow-md border border-gray-700">
        <div className="text-center border-r border-gray-700 last:border-0">
          <p className="text-sm text-gray-400">Duration</p>
          <p className="text-2xl font-bold text-white">{quote.logistics.days} Days</p>
        </div>
        <div className="text-center border-r border-gray-700 last:border-0">
          <p className="text-sm text-gray-400">Hunters</p>
          <p className="text-2xl font-bold text-white">{quote.logistics.hunters}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">Observers</p>
          <p className="text-2xl font-bold text-white">{quote.logistics.observers}</p>
        </div>
      </section>

      {/* Financial Breakdown Table Container */}
      <section className="mb-8 rounded-lg bg-gray-800 p-6 shadow-md border border-gray-700">
        <h2 className="mb-4 text-xl font-semibold text-white">Financial Breakdown (USD)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="border-b border-gray-700 text-gray-400">
              <tr>
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium text-right">Qty</th>
                <th className="pb-3 font-medium text-right">Unit Price</th>
                <th className="pb-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {quote.lineItems?.map((item, index) => (
                <tr key={index} className="hover:bg-gray-700/50 transition-colors">
                  <td className="py-4">{item.description}</td>
                  <td className="py-4 text-right">{item.quantity}</td>
                  <td className="py-4 text-right">${item.unitPrice.toLocaleString()}</td>
                  <td className="py-4 text-right font-medium text-white">${item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grand Total Execution Layout */}
        <div className="mt-6 flex flex-col items-end border-t border-gray-700 pt-6">
          <p className="text-sm text-gray-400 mb-1">{quote.financials.isVatInclusive ? 'Prices are 15% VAT Inclusive' : 'Prices are VAT Exclusive'}</p>
          <div className="flex items-center gap-4">
            <span className="text-lg font-medium text-gray-300">Grand Total:</span>
            <span className="text-4xl font-bold text-green-500">${quote.financials.totalUsd.toLocaleString()}</span>
          </div>
        </div>
      </section>

      {/* Amenities Ground Verification Block */}
      <section className="mb-8 rounded-lg bg-gray-800 p-6 shadow-md border border-gray-700">
        <h2 className="mb-4 text-lg font-semibold text-white">Included in Daily Rate</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-300">
          <li className="flex items-center gap-2">
            <span className={quote.terms.includesAccommodation ? "text-green-500" : "text-gray-600"}>✔</span> Accommodation
          </li>
          <li className="flex items-center gap-2">
            <span className={quote.terms.includesMeals ? "text-green-500" : "text-gray-600"}>✔</span> All Meals
          </li>
        </ul>
      </section>

      {/* Acceptance Interface Framework (Rendered conditionally based on status) */}
      {quote.status === 'PENDING_HUNTER_ACCEPTANCE' && (
        <form onSubmit={handleAcceptQuote} className="rounded-lg border border-orange-900 bg-gray-900 p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold text-orange-500">Confirm & Accept Safari</h2>
          
          <div className="mb-6 rounded border border-red-900/50 bg-red-950/20 p-4 text-sm text-gray-300">
            <p className="font-bold text-red-400 mb-1">STRICT: Wounded Game Policy</p>
            <p>By accepting this quote, you acknowledge and agree that in the event an animal is wounded (blood is drawn) and not recovered, the animal is considered hunted and the <strong className="text-white">full trophy fee must be paid</strong> to the outfitter.</p>
          </div>

          <div className="mb-6 flex items-start gap-3">
            <input 
              type="checkbox" 
              id="hunterTerms" 
              className="mt-1 h-5 w-5 rounded text-orange-600 outline-none focus:ring-orange-500"
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <label htmlFor="hunterTerms" className="text-sm font-medium text-gray-300 cursor-pointer">
              I have reviewed the line items, agree to the final price, and accept the Wounded Game policy.
            </label>
          </div>

          {termsAccepted && (
            <div className="mb-6 animate-fade-in">
              <label className="block text-sm font-medium text-gray-400 mb-2">Type your full legal name to digitally sign and bind this booking:</label>
              <input 
                type="text" 
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full rounded bg-gray-800 p-3 text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" 
                placeholder="e.g. John Doe" 
                required 
              />
            </div>
          )}

          <div className="flex gap-4">
            <button 
              type="submit" 
              disabled={!termsAccepted || signature.length < 3 || isProcessing}
              className="w-full rounded-lg bg-orange-600 py-4 font-bold text-white transition-all hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]"
            >
              {isProcessing ? "Processing..." : "Accept & Pay Deposit"}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}