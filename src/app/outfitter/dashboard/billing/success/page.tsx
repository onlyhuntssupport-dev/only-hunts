"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function BillingSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto pt-16 pb-12 transition-colors duration-300">
      <div className="bg-white dark:bg-olive border-2 border-kalahari/30 dark:border-kalahari/40 rounded-2xl p-10 text-center shadow-xl">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-200 dark:border-green-800/50">
          <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400 animate-in zoom-in duration-500 delay-150" />
        </div>

        <h1 className="text-3xl font-black font-headline text-olive dark:text-off-white mb-4">
          Payment Successful!
        </h1>
        
        <p className="text-lg text-olive/70 dark:text-off-white/70 font-medium mb-10 max-w-md mx-auto">
          Your account has been successfully upgraded. You now have full access to all premium outfitter features and expanded package limits.
        </p>

        <Link href="/outfitter/dashboard/billing">
          <Button className="bg-kalahari hover:bg-kalahari/90 text-white font-black h-14 px-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all inline-flex items-center gap-2">
            Return to Billing <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}