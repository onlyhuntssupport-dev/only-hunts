"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log to an external service like Sentry here
    console.error("Only-Hunts Global Boundary Caught:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-kalahari/10 border border-red-200 dark:border-red-900/50 p-8 rounded-2xl max-w-md w-full text-center shadow-lg">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-black font-headline text-stone-900 dark:text-off-white tracking-tight mb-2">
          Lost the Trail
        </h2>
        <p className="text-sm font-bold text-stone-500 dark:text-stone-400 mb-8">
          We encountered an unexpected snag while loading this specific view.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 bg-kalahari hover:bg-olive text-white font-bold py-3 px-4 rounded-xl transition-colors tracking-wide uppercase text-sm"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Loading Again
          </button>
          
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-white font-bold py-3 px-4 rounded-xl transition-colors tracking-wide uppercase text-sm"
          >
            <Home className="w-4 h-4" />
            Return to Basecamp
          </Link>
        </div>
      </div>
    </div>
  );
}