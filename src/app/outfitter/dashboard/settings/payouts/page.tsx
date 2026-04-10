"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Wallet, Building2, CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";

// South African Banks supported by Paystack
const SA_BANKS = [
  { name: "ABSA Bank", code: "absa" },
  { name: "Capitec Bank", code: "capitec" },
  { name: "First National Bank (FNB)", code: "fnb" },
  { name: "Investec", code: "investec" },
  { name: "Nedbank", code: "nedbank" },
  { name: "Standard Bank", code: "standard_bank" },
  { name: "TymeBank", code: "tyme_bank" },
  { name: "Discovery Bank", code: "discovery_bank" },
];

export default function PayoutsPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  
  const [connectedSubaccount, setConnectedSubaccount] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          try {
            const docRef = doc(db, 'outfitters', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.paystackSubaccountCode) {
                setConnectedSubaccount(data.paystackSubaccountCode);
              }
              if (data.businessName) {
                setBusinessName(data.businessName);
              }
            }
          } catch (error) {
            console.error("Error fetching profile:", error);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    };
    fetchProfile();
  }, []);

  const handleConnectBank = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !businessName || !bankCode || !accountNumber) return;

    setIsSubmitting(true);
    try {
      // 1. Call our Next.js API to create the Paystack Subaccount
      const response = await fetch('/api/paystack/create-subaccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, bankCode, accountNumber }),
      });

      const result = await response.json();

      if (!result.status) {
        throw new Error(result.message);
      }

      const subaccountCode = result.data.subaccount_code;

      // 2. Save the Paystack Subaccount ID to the Outfitter's Firebase Profile
      const outfitterRef = doc(db, 'outfitters', user.uid);
      await setDoc(outfitterRef, {
        paystackSubaccountCode: subaccountCode,
        bankingUpdated: new Date().toISOString()
      }, { merge: true });

      setConnectedSubaccount(subaccountCode);
      alert("Banking details connected successfully!");

    } catch (error: any) {
      console.error("Error connecting bank:", error);
      alert(error.message || "Failed to connect banking details. Please check your account number.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-off-white dark:bg-stone-950"><KuduLoader /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black font-headline text-olive dark:text-off-white tracking-tight flex items-center gap-3">
          <Wallet className="h-8 w-8 text-kalahari" /> Payout Settings
        </h1>
        <p className="text-olive/70 dark:text-off-white/60 font-medium mt-2">
          Connect your South African bank account to receive automated safari deposits.
        </p>
      </div>

      {connectedSubaccount ? (
        <div className="bg-green-50 dark:bg-green-950/20 border-2 border-green-500 rounded-3xl p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          
          <div className="flex items-start gap-6 relative z-10">
            <div className="bg-green-100 dark:bg-green-900/50 p-4 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-green-900 dark:text-green-400 mb-2">Account Connected</h2>
              <p className="text-green-800/80 dark:text-green-300/80 font-medium max-w-lg mb-4">
                Your banking details are verified. You are ready to receive deposits from hunters via the Only-Hunts secure checkout.
              </p>
              <div className="inline-flex items-center gap-2 bg-white dark:bg-stone-900 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800 font-mono text-sm font-bold text-olive dark:text-white">
                Subaccount ID: {connectedSubaccount}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-5 gap-8">
          
          <div className="md:col-span-3 bg-white dark:bg-stone-900 border border-kalahari/20 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-black font-headline text-olive dark:text-white mb-6 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-kalahari" /> Bank Details
            </h2>
            
            <form onSubmit={handleConnectBank} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-2">Registered Business Name</label>
                <input 
                  type="text" 
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-stone-950 border border-gray-200 dark:border-stone-800 rounded-xl py-3 px-4 text-sm font-bold text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari"
                  placeholder="e.g. Wild Dog Safaris Pty Ltd"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-2">Select Bank</label>
                <select 
                  required
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-stone-950 border border-gray-200 dark:border-stone-800 rounded-xl py-3 px-4 text-sm font-bold text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari appearance-none"
                >
                  <option value="" disabled>Select your bank...</option>
                  {SA_BANKS.map(bank => (
                    <option key={bank.code} value={bank.code}>{bank.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-2">Account Number</label>
                <input 
                  type="text" 
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-stone-950 border border-gray-200 dark:border-stone-800 rounded-xl py-3 px-4 text-sm font-bold text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari"
                  placeholder="10-12 digit account number"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-kalahari hover:bg-kalahari/90 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Verifying...</>
                ) : (
                  <>Connect Bank Account <ArrowRight className="h-5 w-5" /></>
                )}
              </button>
            </form>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-orange-50 dark:bg-orange-950/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-900/50">
              <h3 className="font-bold text-orange-900 dark:text-orange-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Why do we need this?
              </h3>
              <p className="text-sm text-orange-800/80 dark:text-orange-300/80 leading-relaxed">
                Only-Hunts uses Paystack Split Payments to securely process hunter deposits. By connecting your bank, the hunter's deposit (minus our 10% platform fee) is automatically and instantly routed to your account.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-stone-900 p-6 rounded-2xl border border-kalahari/10">
              <h3 className="font-bold text-olive dark:text-white mb-3 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" /> Bank-Grade Security
              </h3>
              <p className="text-sm text-olive/70 dark:text-off-white/60 leading-relaxed">
                Your banking information is tokenized and securely stored directly with Paystack. Only-Hunts does not store your account number on our servers.
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}