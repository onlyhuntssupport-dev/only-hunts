"use client";

import { useState } from "react";
import { Loader2, CalendarCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initializeHuntBooking } from "@/app/actions/paystack";
import { auth } from "@/lib/firebase/client"; 

interface CheckoutProps {
  huntId: string;
  outfitterId: string;
  huntTitle: string;
  priceUSD: number;
  depositPercentage: number;
}

export default function HunterCheckoutWidget({ huntId, outfitterId, huntTitle, priceUSD, depositPercentage }: CheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // --- THE INVOICE MATH ---
  const safeDepositPct = depositPercentage || 30; // Fallback to 30% if undefined
  const depositDueUSD = priceUSD * (safeDepositPct / 100);
  const balanceDueUSD = priceUSD - depositDueUSD;

  // Paystack SA requires transactions to be processed in ZAR (Cents).
  // In production, you will fetch this from an FX API. For now, we use a fixed estimate.
  const EXCHANGE_RATE = 19.00; 

  const handleCheckout = async () => {
    // Check if the hunter is logged in before allowing checkout
    if (!auth.currentUser?.email || !auth.currentUser?.uid) {
      alert("Please log in to book this hunt.");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Paystack SA requires ZAR in cents
      const amountCentsZAR = depositDueUSD * EXCHANGE_RATE * 100;

      const res = await initializeHuntBooking(
        auth.currentUser.email,
        huntId,
        outfitterId,
        amountCentsZAR,
        priceUSD,
        safeDepositPct,
        auth.currentUser.uid, // NEW: Passed to webhook for receipt generation
        huntTitle             // NEW: Passed to webhook for receipt generation
      );

      // Redirect to Paystack's secure hosted checkout page
      if (res.authorizationUrl) {
        window.location.href = res.authorizationUrl;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to initialize secure checkout. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-black/40 border border-kalahari/30 rounded-2xl p-6 backdrop-blur-md">
      <h3 className="text-lg font-black text-white font-headline mb-4 border-b border-kalahari/20 pb-3 flex items-center gap-2">
        <CalendarCheck className="h-5 w-5 text-kalahari" /> Traveler's Invoice
      </h3>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center text-sm font-medium text-off-white/70">
          <span>Total Package Price</span>
          <span>${priceUSD.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center text-base font-black text-white bg-kalahari/10 p-3 rounded-lg border border-kalahari/20">
          <span>Due Today ({safeDepositPct}% Deposit)</span>
          <span className="text-kalahari">${depositDueUSD.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center text-sm font-bold text-off-white/50 pt-2 border-t border-kalahari/10">
          <span>Balance (Due on Arrival)</span>
          <span>${balanceDueUSD.toLocaleString()}</span>
        </div>
      </div>

      <Button 
        onClick={handleCheckout} 
        disabled={isProcessing}
        className="w-full h-14 bg-kalahari hover:bg-kalahari/90 text-white font-black text-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all rounded-xl flex items-center justify-center gap-2"
      >
        {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShieldCheck className="h-6 w-6" />}
        {isProcessing ? "Securing Session..." : "Pay Secure Deposit"}
      </Button>
      
      <p className="text-[10px] text-center text-off-white/40 mt-3 font-medium uppercase tracking-widest">
        Processed securely via Paystack
      </p>
    </div>
  );
}