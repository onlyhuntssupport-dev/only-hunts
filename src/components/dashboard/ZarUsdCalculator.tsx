'use client';

import { useState } from 'react';

export default function ZarUsdCalculator() {
  const [zarAmount, setZarAmount] = useState<number | ''>('');
  const [exchangeRate, setExchangeRate] = useState<number>(18.50); // Default average rate
  const [addVat, setAddVat] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Calculation logic
  const calculateUsd = () => {
    if (!zarAmount || zarAmount <= 0) return 0;
    const baseZar = Number(zarAmount);
    const totalZar = addVat ? baseZar * 1.15 : baseZar;
    return (totalZar / exchangeRate).toFixed(0); // Rounded to whole dollar for cleaner pricing
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg transition-transform hover:scale-105"
        title="Open Calculator"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-72 rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 p-3 rounded-t-xl">
        <h3 className="text-sm font-bold text-orange-500">Pricing Helper</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Input: ZAR Amount */}
        <div>
          <label className="block text-xs text-gray-400">Target Amount (ZAR)</label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-2 text-gray-500">R</span>
            <input 
              type="number" 
              value={zarAmount}
              onChange={(e) => setZarAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded bg-gray-800 py-2 pl-8 pr-2 text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              placeholder="10000"
            />
          </div>
        </div>

        {/* Input: Exchange Rate */}
        <div>
          <label className="block text-xs text-gray-400">Exchange Rate (ZAR to 1 USD)</label>
          <div className="relative mt-1">
            <input 
              type="number" 
              step="0.1"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(Number(e.target.value))}
              className="w-full rounded bg-gray-800 p-2 text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Toggle: VAT */}
        <label className="flex cursor-pointer items-center space-x-2">
          <input 
            type="checkbox" 
            checked={addVat}
            onChange={(e) => setAddVat(e.target.checked)}
            className="h-4 w-4 rounded text-orange-500 outline-none focus:ring-orange-500"
          />
          <span className="text-xs text-gray-300">Add 15% VAT</span>
        </label>

        {/* Output: Final USD */}
        <div className="mt-4 rounded-lg bg-gray-800 p-3 text-center border border-gray-700">
          <p className="text-xs text-gray-400">Final USD Amount</p>
          <p className="text-2xl font-bold text-green-500">${calculateUsd()}</p>
        </div>
      </div>
    </div>
  );
}