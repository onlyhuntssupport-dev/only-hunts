"use client";

import { useState, useEffect } from "react";
import { Loader2, ShieldCheck, Landmark, Globe, AlertTriangle, CheckCircle2, ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PaystackVerificationCardProps {
  baseCountry: string;
  currentPaystackId?: string;
  onVerificationSuccess: (subaccountId: string) => void;
}

// Regional Bank Dictionaries
const BANK_DICTIONARY: Record<string, string[]> = {
  "South Africa": ["FNB", "Standard Bank", "Absa", "Capitec", "Nedbank", "Investec", "TymeBank", "Discovery Bank"],
  "Namibia": ["First National Bank Namibia", "Standard Bank Namibia", "Bank Windhoek", "Nedbank Namibia", "Letshego Bank"],
  "Zimbabwe": ["CBZ Bank", "Stanbic Bank Zimbabwe", "Standard Chartered", "FBC Bank", "Nedbank Zimbabwe", "Ecobank Zimbabwe", "CABS", "ZB Bank"],
  "Botswana": ["First National Bank Botswana", "Standard Chartered Botswana", "Absa Bank Botswana", "Stanbic Bank Botswana", "BancABC"],
  "Mozambique": ["Millennium bim", "BCI", "Standard Bank Moçambique", "Absa Bank Moçambique", "FNB Moçambique", "Moza Banco"]
};

export default function PaystackVerificationCard({ baseCountry, currentPaystackId, onVerificationSuccess }: PaystackVerificationCardProps) {
  // Logic States
  const defaultIsLocal = baseCountry?.trim().toLowerCase() === "south africa";
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [showLocalForm, setShowLocalForm] = useState(defaultIsLocal);
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">(currentPaystackId ? "success" : "idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Form States
  const [bankName, setBankName] = useState("");
  const [customBankName, setCustomBankName] = useState("");
  const [isCustomBank, setIsCustomBank] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [accountName, setAccountName] = useState("");

  // Sync form default if base country changes, unless user manually overrode it
  useEffect(() => {
    if (!isManualOverride) {
      setShowLocalForm(baseCountry?.trim().toLowerCase() === "south africa");
    }
  }, [baseCountry, isManualOverride]);

  const handleToggleOverride = () => {
    setIsManualOverride(true);
    setShowLocalForm(!showLocalForm);
    // Reset fields on switch
    setBankName("");
    setCustomBankName("");
    setIsCustomBank(false);
    setAccountNumber("");
    setSwiftCode("");
    setAccountName("");
    setErrorMsg("");
  };

  const handleBankSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "OTHER") {
      setIsCustomBank(true);
      setBankName("");
    } else {
      setIsCustomBank(false);
      setBankName(val);
    }
  };

  const handleVerify = async () => {
    setErrorMsg("");
    const finalBankName = isCustomBank ? customBankName : bankName;
    
    // Basic Validation
    if (showLocalForm && (!finalBankName || !accountNumber)) {
      setErrorMsg("Please select a bank and enter an account number.");
      return;
    }
    if (!showLocalForm && (!finalBankName || !accountNumber || !swiftCode || !accountName)) {
      setErrorMsg("All international banking fields are required.");
      return;
    }

    setLoading(true);

    try {
      // TODO: Replace with actual Paystack API Call
      // Simulating API latency
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock Success
      const mockSubaccountId = `ACCT_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      setStatus("success");
      onVerificationSuccess(mockSubaccountId);

    } catch (err) {
      setStatus("error");
      setErrorMsg("Verification failed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Determine which bank list to show in the SWIFT form
  // If they override SA to SWIFT, show a generic empty list to force manual entry, or use the base country list
  const availableBanks = BANK_DICTIONARY[baseCountry] || [];

  return (
    <div className="pt-6 border-t border-kalahari/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="bg-kalahari text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Step 5</span>
        <label className="block text-sm font-bold text-kalahari uppercase tracking-widest">Financial Verification</label>
      </div>
      
      <div className="bg-black/40 border border-kalahari/30 rounded-xl p-6 relative overflow-hidden transition-all duration-300">
        {/* Trust Badges */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-50 pointer-events-none">
          <ShieldCheck className="h-6 w-6 text-kalahari" />
        </div>

        <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black font-headline text-white flex items-center gap-2">
              {showLocalForm ? <Landmark className="h-5 w-5 text-kalahari" /> : <Globe className="h-5 w-5 text-kalahari" />}
              {showLocalForm ? "Domestic Payout Details" : "International SWIFT Payouts"}
            </h3>
            <p className="text-sm text-off-white/70 mt-1 max-w-xl">
              {showLocalForm 
                ? "Securely connect your South African bank account to receive automated 20% deposit payouts." 
                : "Payouts will be routed via the international SWIFT network. Please provide accurate routing instructions."}
            </p>
          </div>
          
          {status !== "success" && (
            <button 
              type="button" 
              onClick={handleToggleOverride}
              className="shrink-0 text-xs font-bold text-kalahari hover:text-white flex items-center gap-1.5 transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5"
            >
              <ArrowRightLeft className="h-3 w-3" />
              {showLocalForm ? "Switch to International Bank" : "Switch to South African Bank"}
            </button>
          )}
        </div>

        {status === "success" ? (
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
            <h4 className="text-lg font-bold text-white">Bank Account Verified</h4>
            <p className="text-sm text-green-200/70 mt-1">
              Your account is successfully linked to Paystack (ID: {currentPaystackId || "Pending Save"}). You are ready to accept bookings.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setStatus("idle")} 
              className="mt-4 border-kalahari/30 text-white hover:bg-kalahari/10 font-bold"
            >
              Update Banking Details
            </Button>
          </div>
        ) : (
          <div className="space-y-5 animate-in fade-in duration-300">
            {errorMsg && (
              <div className="bg-red-900/40 text-red-200 p-3 rounded-lg border border-red-500/30 font-bold text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {errorMsg}
              </div>
            )}

            {showLocalForm ? (
              // DOMESTIC SA FORM
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-kalahari uppercase tracking-widest mb-2">Select Bank</label>
                  <select
                    value={isCustomBank ? "OTHER" : bankName}
                    onChange={handleBankSelection}
                    className="w-full h-12 px-4 bg-black/40 border border-kalahari/30 rounded-xl text-white font-bold outline-none focus:ring-1 focus:ring-kalahari"
                  >
                    <option value="" disabled>Choose your bank...</option>
                    {(BANK_DICTIONARY["South Africa"] || []).map(b => <option key={b} value={b}>{b}</option>)}
                    <option value="OTHER">Other (Enter Manually)...</option>
                  </select>
                  {isCustomBank && (
                    <Input 
                      type="text" 
                      value={customBankName} 
                      onChange={(e) => setCustomBankName(e.target.value)} 
                      className="h-12 bg-black/40 border-kalahari/30 text-white focus-visible:ring-kalahari font-bold rounded-xl shadow-inner mt-3" 
                      placeholder="Enter bank name" 
                      autoFocus
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-kalahari uppercase tracking-widest mb-2">Account Number</label>
                  <Input 
                    type="text" 
                    value={accountNumber} 
                    onChange={(e) => setAccountNumber(e.target.value)} 
                    className="h-12 bg-black/40 border-kalahari/30 text-white focus-visible:ring-kalahari font-mono text-lg rounded-xl shadow-inner" 
                    placeholder="e.g. 62001234567" 
                  />
                </div>
              </div>
            ) : (
              // INTERNATIONAL SWIFT FORM
              <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-kalahari uppercase tracking-widest mb-2">
                    Registered Legal Entity Name
                  </label>
                  <p className="text-[10px] text-off-white/50 mb-2 leading-tight">Must match your business registration exactly. Do not use your trading name (DBA) if it differs. Mismatches will cause cross-border transfers to fail.</p>
                  <Input 
                    type="text" 
                    value={accountName} 
                    onChange={(e) => setAccountName(e.target.value)} 
                    className="h-12 bg-black/40 border-kalahari/30 text-white focus-visible:ring-kalahari font-bold rounded-xl shadow-inner" 
                    placeholder="e.g. Olifants Safaris PTY LTD" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-kalahari uppercase tracking-widest mb-2">SWIFT / BIC Code</label>
                  <Input 
                    type="text" 
                    value={swiftCode} 
                    onChange={(e) => setSwiftCode(e.target.value.toUpperCase())} 
                    className="h-12 bg-black/40 border-kalahari/30 text-white focus-visible:ring-kalahari font-mono text-lg rounded-xl shadow-inner uppercase" 
                    placeholder="8 or 11 characters" 
                    maxLength={11}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-kalahari uppercase tracking-widest mb-2">Bank Name</label>
                  <select
                    value={isCustomBank ? "OTHER" : bankName}
                    onChange={handleBankSelection}
                    className="w-full h-12 px-4 bg-black/40 border border-kalahari/30 rounded-xl text-white font-bold outline-none focus:ring-1 focus:ring-kalahari"
                  >
                    <option value="" disabled>Choose your bank...</option>
                    {availableBanks.map(b => <option key={b} value={b}>{b}</option>)}
                    <option value="OTHER">Other (Enter Manually)...</option>
                  </select>
                  {isCustomBank && (
                    <Input 
                      type="text" 
                      value={customBankName} 
                      onChange={(e) => setCustomBankName(e.target.value)} 
                      className="h-12 bg-black/40 border-kalahari/30 text-white focus-visible:ring-kalahari font-bold rounded-xl shadow-inner mt-3" 
                      placeholder="Enter international bank name" 
                      autoFocus
                    />
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-kalahari uppercase tracking-widest mb-2">Account Number / IBAN</label>
                  <Input 
                    type="text" 
                    value={accountNumber} 
                    onChange={(e) => setAccountNumber(e.target.value)} 
                    className="h-12 bg-black/40 border-kalahari/30 text-white focus-visible:ring-kalahari font-mono text-lg rounded-xl shadow-inner" 
                    placeholder="International routing number" 
                  />
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <Button 
                type="button" 
                onClick={handleVerify} 
                disabled={loading} 
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold h-12 px-8 transition-all rounded-xl"
              >
                {loading ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Verifying with Gateway...</> : "Verify & Secure Account"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}