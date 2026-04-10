"use client";

import { Button } from "@/components/ui/button";
import { CreditCard, Zap, CheckCircle2, AlertCircle, Receipt, Download } from "lucide-react";

const MOCK_SUBSCRIPTION = {
  tier: "Professional",
  price: "R 999",
  interval: "month",
  status: "active",
  nextBillingDate: "May 1, 2026",
  huntsUsed: 12,
  huntsLimit: 20,
};

const MOCK_INVOICES = [
  { id: "INV-001", date: "Apr 1, 2026", amount: "R 999.00", status: "Paid" },
  { id: "INV-002", date: "Mar 1, 2026", amount: "R 999.00", status: "Paid" },
  { id: "INV-003", date: "Feb 1, 2026", amount: "R 999.00", status: "Paid" },
];

export default function BillingPage() {
  const handleManageBilling = () => {
    alert("Paystack integration pending. This will open the payment modal once configured.");
  };

  const usagePercentage = (MOCK_SUBSCRIPTION.huntsUsed / MOCK_SUBSCRIPTION.huntsLimit) * 100;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 transition-colors duration-300">
      <div className="border-b-2 border-kalahari/30 dark:border-kalahari/20 pb-6">
        <h1 className="text-3xl font-headline font-bold text-olive dark:text-off-white tracking-tight">Billing & Subscription</h1>
        <p className="text-olive/70 dark:text-off-white/70 font-medium mt-1">Manage your plan, usage, and payment methods.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-olive border-2 border-kalahari/30 dark:border-kalahari/40 rounded-xl p-8 shadow-sm transition-colors">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-black text-olive dark:text-off-white">{MOCK_SUBSCRIPTION.tier} Plan</h2>
                  <span className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 border border-green-200 dark:border-green-800 transition-colors">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </span>
                </div>
                <p className="text-olive/70 dark:text-off-white/70 font-bold text-lg">
                  {MOCK_SUBSCRIPTION.price} / {MOCK_SUBSCRIPTION.interval}
                </p>
                <p className="text-sm text-olive/50 dark:text-off-white/50 font-medium mt-1">
                  Next billing date: {MOCK_SUBSCRIPTION.nextBillingDate}
                </p>
              </div>

              <Button 
                onClick={handleManageBilling}
                className="bg-kalahari hover:bg-kalahari/90 text-white font-bold h-12 px-6 rounded-lg w-full md:w-auto transition-all flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <CreditCard className="h-5 w-5" />
                Manage Subscription
              </Button>
            </div>
          </div>

          <div className="bg-white dark:bg-olive border-2 border-kalahari/30 dark:border-kalahari/40 rounded-xl p-8 shadow-sm transition-colors">
            <h3 className="text-xl font-bold font-headline text-olive dark:text-off-white mb-6 flex items-center gap-2">
              <Zap className="h-5 w-5 text-kalahari" /> Platform Usage
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-bold text-olive dark:text-off-white">
                <span>Active Hunt Packages</span>
                <span>{MOCK_SUBSCRIPTION.huntsUsed} / {MOCK_SUBSCRIPTION.huntsLimit}</span>
              </div>
              <div className="w-full bg-off-white dark:bg-black/40 rounded-full h-3 overflow-hidden border border-kalahari/20 transition-colors">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ${usagePercentage > 85 ? 'bg-red-500' : 'bg-kalahari'}`}
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>
              {usagePercentage > 85 && (
                <p className="text-sm text-red-600 dark:text-red-400 font-bold flex items-center gap-1 mt-2 transition-colors">
                  <AlertCircle className="h-4 w-4" /> You are approaching your plan limit.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-olive border-2 border-kalahari/30 dark:border-kalahari/40 rounded-xl shadow-sm overflow-hidden flex flex-col h-full transition-colors">
            <div className="p-6 border-b border-kalahari/20 dark:border-kalahari/30 bg-off-white/50 dark:bg-black/10 transition-colors">
              <h3 className="text-lg font-bold font-headline text-olive dark:text-off-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-kalahari" /> Billing History
              </h3>
            </div>
            <div className="p-6 flex-1">
              <div className="space-y-4">
                {MOCK_INVOICES.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between group">
                    <div>
                      <p className="text-sm font-bold text-olive dark:text-off-white">{invoice.amount}</p>
                      <p className="text-xs font-medium text-olive/60 dark:text-off-white/50">{invoice.date}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-olive/50 hover:text-kalahari dark:text-off-white/50 dark:hover:text-kalahari transition-colors">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-kalahari/20 dark:border-kalahari/30 bg-off-white/50 dark:bg-black/10 text-center transition-colors">
              <p className="text-xs font-medium text-olive/50 dark:text-off-white/50">
                Secure payments processed by <strong>Paystack</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}