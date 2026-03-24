'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global App Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-off-white text-olive dark:text-off-white p-4">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="mb-6 opacity-70">{error.message}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-olive text-white rounded hover:bg-olive/80"
      >
        Try again
      </button>
    </div>
  );
}