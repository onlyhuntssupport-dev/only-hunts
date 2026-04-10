import Link from 'next/link';

export default function OnlyQuotesCard() {
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-orange-500 bg-gray-900 p-6 shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]">
      {/* Optional: Add your transparent logo absolute positioned in the corner here */}
      
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">
          <span className="text-orange-500">Only</span>-Quotes
        </h3>
        <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-400">
          PRO FEATURE
        </span>
      </div>
      
      <p className="mb-6 text-sm text-gray-300">
        Stop typing manual proposals at 10 PM. Set your base rates and species matrix once, and let our engine automatically draft custom trip quotes for verified hunters.
      </p>
      
      <Link 
        href="/outfitter/dashboard/only-quotes"
        className="inline-block w-full rounded-lg bg-orange-600 px-4 py-2.5 text-center font-bold text-white transition-colors hover:bg-orange-700"
      >
        Configure Pricing Matrix
      </Link>
    </div>
  );
}