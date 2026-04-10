"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Download, ShieldCheck, ArrowRight, DollarSign, Wallet, Banknote, Briefcase, Activity, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";

// The ledger is completely empty for a clean slate.
const TRANSACTIONS: any[] = [];

export default function OutfitterFinancialDashboard() {
  const router = useRouter();
  
  const [ledgerTab, setLedgerTab] = useState<"ACTIVE" | "PAST">("ACTIVE");

  const displayedTransactions = TRANSACTIONS.filter(tx => 
    ledgerTab === "ACTIVE" ? tx.status === "SECURED" : tx.status === "COLLECTED"
  );

  return (
    <div className="min-h-screen bg-off-white dark:bg-stone-950 transition-colors duration-300 pb-20">
      
      {/* Header */}
      <div className="bg-olive dark:bg-black py-12 border-b-4 border-kalahari relative overflow-hidden text-center sm:text-left">
        <div className="absolute inset-0 opacity-10 bg-[url('/pattern.svg')]"></div>
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <button 
            onClick={() => router.push('/outfitter/dashboard')}
            className="flex items-center text-kalahari hover:text-white text-sm font-bold transition-colors mb-6 mx-auto sm:mx-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Basecamp
          </button>
          <h1 className="text-4xl md:text-5xl font-black font-headline text-white tracking-tight flex flex-col sm:flex-row items-center gap-3">
            <Briefcase className="h-10 w-10 text-kalahari" /> Revenue & Plans
          </h1>
          <p className="text-off-white/70 mt-3 text-lg font-medium max-w-xl mx-auto sm:mx-0">
            Track your net earnings, upfront deposits, and outstanding hunter balances.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-10 space-y-8">
        
        {/* Top Grid: Current Tier & Financial Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Current Tier Card */}
          <div className="bg-white/95 dark:bg-stone-900 border-2 border-kalahari/20 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldCheck className="h-32 w-32 text-kalahari" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-black text-olive/50 dark:text-off-white/40 uppercase tracking-[0.2em]">Platform Status</h2>
                <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-green-200 dark:border-green-800">Verified</span>
              </div>
              
              <h3 className="text-3xl font-black font-headline text-olive dark:text-off-white mb-2">
                Tier 2 Outfitter
              </h3>
              <p className="text-xs font-bold text-kalahari mb-6 uppercase tracking-[0.3em]">
                Premium Partner
              </p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start text-sm font-bold text-olive dark:text-off-white/80">
                  <CheckCircle2 className="h-5 w-5 text-kalahari mr-3 shrink-0" /> 
                  <span>Reduced Deposit Commission <span className="text-kalahari">(8%)</span></span>
                </li>
                <li className="flex items-start text-sm font-bold text-olive dark:text-off-white/80">
                  <CheckCircle2 className="h-5 w-5 text-kalahari mr-3 shrink-0" /> 
                  <span>Priority Search Placement in Marketplace</span>
                </li>
                <li className="flex items-start text-sm font-bold text-olive dark:text-off-white/80">
                  <CheckCircle2 className="h-5 w-5 text-kalahari mr-3 shrink-0" /> 
                  <span>Verified Gold Shield on All Listings</span>
                </li>
              </ul>

              <Button 
                onClick={() => router.push('/outfitter/tiers')}
                className="w-full bg-olive dark:bg-kalahari text-off-white dark:text-olive font-black h-12 rounded-xl shadow-md hover:translate-y-[-2px] transition-all"
              >
                View Tier Benefits <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Financial Overview Card */}
          <div className="bg-white/95 dark:bg-stone-900 border-2 border-kalahari/10 rounded-3xl p-8 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] font-black text-olive/50 dark:text-off-white/40 uppercase tracking-[0.2em]">Financial Overview</h2>
                <DollarSign className="h-5 w-5 text-kalahari" />
              </div>

              <div className="space-y-4">
                {/* Outfitter Net Earnings */}
                <div className="bg-slate-50 dark:bg-black/40 border-2 border-slate-100 dark:border-stone-800 rounded-2xl p-6 flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-olive/40 dark:text-off-white/50 uppercase tracking-widest">Your Net Earnings (YTD)</p>
                      <p className="font-black text-olive dark:text-off-white text-2xl tracking-tighter">$0.00</p>
                    </div>
                  </div>
                </div>

                {/* Outstanding Hunter Balances */}
                <div className="bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-100 dark:border-orange-900/20 rounded-2xl p-6 flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                      <Banknote className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-orange-600/70 dark:text-orange-400/70 uppercase tracking-widest">Hunter Balances Due</p>
                      <p className="font-black text-orange-700 dark:text-orange-300 text-2xl tracking-tighter">$0.00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-kalahari/10 text-center">
              <p className="text-[10px] font-black text-olive/40 dark:text-off-white/30 uppercase tracking-[0.2em] leading-relaxed">
                Platform deposits are collected upfront. Balances are collected directly by outfitter.
              </p>
            </div>
          </div>

        </div>

        {/* Transaction Split Ledger */}
        <div className="bg-white dark:bg-stone-900 border-2 border-kalahari/10 rounded-3xl overflow-hidden shadow-xl">
          
          {/* Header & Tab Switcher */}
          <div className="p-6 border-b border-kalahari/10 bg-slate-50/50 dark:bg-black/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <h2 className="text-lg font-black text-olive dark:text-off-white uppercase tracking-tight flex items-center gap-2 shrink-0">
              Booking Ledger
            </h2>
            
            <div className="flex items-center gap-2 bg-white/80 dark:bg-black/50 p-1.5 rounded-2xl backdrop-blur-sm border-2 border-kalahari/20 shadow-sm w-full sm:w-auto">
              <button 
                onClick={() => setLedgerTab("ACTIVE")} 
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${ledgerTab === "ACTIVE" ? "bg-kalahari text-white shadow-md scale-[1.02]" : "text-olive/70 dark:text-off-white/60 hover:text-kalahari"}`}
              >
                <Activity className="h-3.5 w-3.5" /> Active Deals
              </button>
              <button 
                onClick={() => setLedgerTab("PAST")} 
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${ledgerTab === "PAST" ? "bg-kalahari text-white shadow-md scale-[1.02]" : "text-olive/70 dark:text-off-white/60 hover:text-kalahari"}`}
              >
                <Archive className="h-3.5 w-3.5" /> Past Bookings
              </button>
            </div>

            <Button variant="outline" size="sm" className="text-[10px] font-black border-kalahari/30 text-olive dark:text-off-white hover:bg-kalahari/10 px-4 hidden sm:flex shrink-0" disabled>
              Export <Download className="h-3 w-3 ml-2" />
            </Button>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-kalahari/5 text-[10px] font-black uppercase tracking-widest text-olive/40 dark:text-off-white/30">
                <tr>
                  <th className="px-6 py-5">Date</th>
                  <th className="px-6 py-5">Client Name</th>
                  <th className="px-6 py-5">Total Price</th>
                  <th className="px-6 py-5 text-kalahari/70 border-l border-r border-kalahari/10 bg-kalahari/5">Platform Deposit</th>
                  <th className="px-6 py-5">Your Net Balance</th>
                  <th className="px-6 py-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kalahari/10">
                {displayedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Briefcase className="h-12 w-12 text-kalahari/20 mx-auto mb-3" />
                      <p className="text-sm font-bold text-olive/50 dark:text-off-white/50">
                        No {ledgerTab === "ACTIVE" ? "active deals" : "past bookings"} found.
                      </p>
                      <p className="text-xs font-medium text-olive/40 dark:text-off-white/40 mt-1">
                        Transactions will appear here once a hunter secures a booking.
                      </p>
                    </td>
                  </tr>
                ) : (
                  displayedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-5 text-sm font-bold text-olive/60 dark:text-off-white/50">{tx.date}</td>
                      <td className="px-6 py-5 text-sm font-black text-olive dark:text-off-white">{tx.client}</td>
                      <td className="px-6 py-5 text-sm font-medium text-olive/70 dark:text-off-white/70">{tx.total}</td>
                      <td className="px-6 py-5 text-sm font-medium text-kalahari border-l border-r border-kalahari/10 bg-kalahari/5">-{tx.deposit}</td>
                      <td className="px-6 py-5 text-sm font-black text-green-600 dark:text-green-400">{tx.net}</td>
                      <td className="px-6 py-5">
                        {tx.status === "COLLECTED" ? (
                          <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter border border-green-200 dark:border-green-800 shadow-sm">
                            Balance Collected
                          </span>
                        ) : (
                          <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter border border-blue-200 dark:border-blue-800 shadow-sm">
                            Deposit Secured
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}