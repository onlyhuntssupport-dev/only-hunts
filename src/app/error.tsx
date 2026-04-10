"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-950 text-white p-4">
      <div className="bg-black/50 border border-red-500/30 p-8 rounded-2xl max-w-lg text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-500">System Error</h2>
        <p className="text-stone-400 mb-6">Something went wrong while loading this page.</p>
        <button
          onClick={() => reset()}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}