'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; 
import { db, auth } from '@/lib/firebase/client';
import { declineCustomQuote } from '@/lib/firebase/quoteService'; 
import { initializeHuntBooking } from '@/app/actions/paystack'; // NEW: Import the payment gateway

// Mocking the initial data fetch for UI building purposes. 
const mockQuote = {
  id: 'quote_98765',
  outfitterId: 'mock_outfitter_id_123', // Added so the payment gateway has a destination
  outfitterName: 'Bushveld Safaris',
  status: 'PENDING_HUNTER_ACCEPTANCE',
  logistics: { days: 7, hunters: 2, observers: 1 },
  financials: { baseRateTotal: 6300, trophyFeeTotal: 4500, totalUsd: 10800, isVatInclusive: true },
  lineItems: [
    { description: '2 Hunter(s) x 7 Days', quantity: 14, unitPrice: 350, total: 4900 },
    { description: '1 Observer(s) x 7 Days', quantity: 7, unitPrice: 200, total: 1400 },
    { description: 'Trophy Fee: Kudu (Bull)', quantity: 1, unitPrice: 2500, total: 2500 },
    { description: 'Trophy Fee: Gemsbok / Oryx', quantity: 1, unitPrice: 1200, total: 1200 },
    { description: 'Trophy Fee: Springbok', quantity: 1, unitPrice: 800, total: 800 },
  ],
  terms: { includesAccommodation: true, includesMeals: true, woundedGamePolicyApplies: true },
  expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
};

export default function HunterQuoteReviewPage() {
  const router = useRouter(); 
  const [quote, setQuote] = useState(mockQuote);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signature, setSignature] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // The LIVE Acceptance Function
  const handleAcceptQuote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth.currentUser?.email || !auth.currentUser?.uid) {
      alert("Please log in to accept this quote.");
      return;
    }

    setIsProcessing(true);

    try {
      const outfitterEmail = 'admin@bushveldsafaris.com'; 
      
      // 1. Write digital signature to Firestore to formally accept the terms
      const quoteRef = doc(db, 'quotes', quote.id);
      await setDoc(quoteRef, {
        status: 'ACCEPTED_AWAITING_DEPOSIT', // Updated status to reflect pending payment
        acceptedBy: signature,
        outfitterEmail: outfitterEmail,
        acceptedAt: serverTimestamp(),
        outfitterName: quote.outfitterName,
        logistics: quote.logistics,
        financials: quote.financials,
        lineItems: quote.lineItems,
        terms: quote.terms,
      }, { merge: true });

      // --- 2. EMAIL ENGINE DISPATCH (SILENT FAILSAFE) ---
      try {
        const idToken = await auth.currentUser.getIdToken(true);
        const hunterName = auth.currentUser.displayName || signature || "Your client";

        await fetch("/api/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({
            to: outfitterEmail,
            subject: `Quote Accepted: ${hunterName} Locked In`,
            userName: quote.outfitterName,
            title: "Safari Booking Confirmed!",
            message: `Great news! ${hunterName} has accepted your custom quote and digitally signed the terms. The booking for $${quote.financials.totalUsd.toLocaleString()} USD is now locked in. Log in to your dashboard to view the final itinerary and prepare for their arrival.`,
            ctaText: "View Confirmed Booking",
            ctaLink: "https://www.only-hunts.com/outfitter/dashboard",
          }),
        });
      } catch (emailErr) {
        console.error("Silent failure: Email engine dropped the outfitter notification", emailErr);
      }

      // --- 3. PAYSTACK PAYMENT GATEWAY INIT ---
      // We assume a standard 30% deposit for custom quotes unless specified otherwise
      const depositPct = 30; 
      const depositDueUSD = quote.financials.totalUsd * (depositPct / 100);
      const EXCHANGE_RATE = 19.00; // Fixed estimate for ZAR conversion
      const amountCentsZAR = depositDueUSD * EXCHANGE_RATE * 100;

      const res = await initializeHuntBooking(
        auth.currentUser.email,
        quote.id, // Custom Quotes use their Quote ID as the Hunt ID for tracking
        quote.outfitterId, 
        amountCentsZAR,
        quote.financials.totalUsd,
        depositPct,
        auth.currentUser.uid, // NEW: Passed to webhook for receipt generation
        `Custom Safari Quote: ${quote.outfitterName}` // NEW: Passed to webhook for PDF Title
      );

      // Redirect directly to Paystack to secure the deposit
      if (res.authorizationUrl) {
        window.location.href = res.authorizationUrl;
      } else {
        throw new Error("Failed to retrieve payment URL");
      }
      
    } catch (error: any) {
      console.error("Error accepting quote:", error);
      alert("An unexpected error occurred: " + error.message);
      setIsProcessing(false); 
    } 
  };

  // The LIVE Decline Function
  const handleDeclineQuote = async () => {
    if (confirm("Are you sure you want to decline this custom quote?")) {
      setIsProcessing(true);
      try {
         const quoteRef = doc(db, 'quotes', quote.id);
         await setDoc(quoteRef, {
           status: 'DECLINED',
           declinedAt: serverTimestamp(),
         }, { merge: true });
         
         router.push('/hunter/dashboard'); 
      } catch (error) {
        console.error("Error declining quote:", error);
        alert("Error declining quote.");
        setIsProcessing(false);
      }
    }
  };

  if (!quote) return <div className="p-10 text-center text-white">Loading Quote...</div>;

  return (
    <div className="mx-auto max-w-4xl p-6 relative pb-24">
      
      {/* Header & Status */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-700 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Custom Safari Proposal</h1>
          <p className="text-gray-400 mt-1">Prepared by <span className="font-semibold text-orange-500">{quote.outfitterName}</span></p>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold ${
            quote.status.includes('ACCEPTED') ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 
            quote.status === 'DECLINED' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 
            'bg-orange-500/20 text-orange-400 border border-orange-500/50'
          }`}>
            {quote.status.replace(/_/g, ' ')}
          </span>
          <p className="text-xs text-gray-500 mt-2">Valid until: {quote.expiresAt}</p>
        </div>
      </div>

      {/* Logistics Summary */}
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

      {/* Financial Breakdown (The Line Items) */}
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
              {quote.lineItems.map((item, index) => (
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

        {/* Grand Total */}
        <div className="mt-6 flex flex-col items-end border-t border-gray-700 pt-6">
          <p className="text-sm text-gray-400 mb-1">{quote.financials.isVatInclusive ? 'Prices are 15% VAT Inclusive' : 'Prices are VAT Exclusive'}</p>
          <div className="flex items-center gap-4">
            <span className="text-lg font-medium text-gray-300">Grand Total:</span>
            <span className="text-4xl font-bold text-green-500">${quote.financials.totalUsd.toLocaleString()}</span>
          </div>
        </div>
      </section>

      {/* Amenities Included */}
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

      {/* Acceptance & Liability Shield (Only shows if Pending) */}
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
              type="button"
              onClick={handleDeclineQuote}
              disabled={isProcessing}
              className="w-1/3 rounded-lg border border-gray-600 bg-transparent py-4 font-bold text-gray-400 transition-all hover:bg-gray-800 hover:text-white disabled:opacity-50"
            >
              Decline
            </button>
            <button 
              type="submit" 
              disabled={!termsAccepted || signature.length < 3 || isProcessing}
              className="w-2/3 rounded-lg bg-orange-600 py-4 font-bold text-white transition-all hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]"
            >
              {isProcessing ? "Processing..." : "Accept & Pay Deposit"}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}