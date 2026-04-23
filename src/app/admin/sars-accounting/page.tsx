"use client";

import React, { useState } from 'react';

// Added 'advertising' to the strict tab types
type TabType = 'subscriptions' | 'commissions' | 'deposits' | 'advertising';

export default function SarsAccountingDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('subscriptions');
  const [taxYear, setTaxYear] = useState('2026-2027');

  // Zeroed out KPIs for production readiness
  const kpis = {
    totalRevenue: 'R 0.00',
    vatLiability: 'R 0.00', 
    activeSubscriptions: 0,
  };

  // Cleared all dummy data. The table will now render the empty state fallback.
  const transactions: any[] = []; 

  return (
    <div className="p-8 max-w-7xl mx-auto text-gray-800">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">SARS Accounting Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">Immutable Financial Records for Only-Hunts</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-white p-3 rounded-md shadow-sm border border-gray-200">
          <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Tax Year:</label>
          <select 
            value={taxYear} 
            onChange={(e) => setTaxYear(e.target.value)}
            className="border-none bg-transparent text-sm font-bold text-gray-900 focus:ring-0 cursor-pointer"
          >
            <option value="2025-2026">Mar 2025 - Feb 2026</option>
            <option value="2026-2027">Mar 2026 - Feb 2027</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-green-600">
          <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Gross Platform Revenue</p>
          <p className="text-3xl font-bold text-gray-900">{kpis.totalRevenue}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-red-600">
          <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Estimated VAT Liability (15%)</p>
          <p className="text-3xl font-bold text-gray-900">{kpis.vatLiability}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-blue-600">
          <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Active Subscriptions</p>
          <p className="text-3xl font-bold text-gray-900">{kpis.activeSubscriptions}</p>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="-mb-px flex space-x-8 min-w-max pb-1">
          {[
            { id: 'subscriptions', label: 'R800 Subscriptions' },
            { id: 'commissions', label: 'Platform Commissions' },
            { id: 'advertising', label: 'Advertising Revenue' }, // New Advertising Tab
            { id: 'deposits', label: 'Non-Refundable Deposits' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm uppercase tracking-wider transition-colors
                ${activeTab === tab.id 
                  ? 'border-green-600 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 uppercase">
            {activeTab === 'subscriptions' && 'Monthly Outfitter Subscriptions'}
            {activeTab === 'commissions' && 'Marketplace Hunt Commissions'}
            {activeTab === 'advertising' && 'Sponsored Advertising Revenue'}
            {activeTab === 'deposits' && 'Held Non-Refundable Deposits'}
          </h2>
          <button className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded text-sm font-semibold uppercase tracking-wider transition-colors">
            Export CSV
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Entity</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Gross Amount</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">VAT (15%)</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-semibold">{row.outfitter}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{row.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.vat}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 uppercase">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
              
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 font-semibold uppercase tracking-widest">
                    No records found for this category in the selected tax year.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}