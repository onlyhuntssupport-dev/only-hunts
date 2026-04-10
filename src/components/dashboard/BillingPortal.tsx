'use client'

import { useState } from 'react';
import { initializeSubscription } from '@/app/actions/paystack';

interface BillingPortalProps {
  email: string;
  outfitterId: string;
  currentTier: 'free_trial' | 'pro_tier';
}

export default function BillingPortal({ email, outfitterId, currentTier }: BillingPortalProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { authorizationUrl } = await initializeSubscription(email, outfitterId);
      // Redirect to Paystack secure checkout
      window.location.href = authorizationUrl;
    } catch (error) {
      console.error(error);
      alert('Could not initiate checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">Subscription & Billing</h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded border">
        <p className="text-gray-600 font-medium">Current Status:</p>
        <p className={`text-lg font-bold ${currentTier === 'pro_tier' ? 'text-green-600' : 'text-orange-500'}`}>
          {currentTier === 'pro_tier' ? 'Pro Tier (Active)' : 'Free Trial (Beta)'}
        </p>
      </div>

      {currentTier === 'free_trial' && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="text-xl font-bold text-blue-900 mb-2">Upgrade to Pro</h3>
          <p className="text-blue-800 mb-4">
            Lock in your access to the Only-Quotes Engine and premium marketplace positioning for R799/month.
          </p>
          <button 
            onClick={handleUpgrade}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Upgrade Now - R799/mo'}
          </button>
        </div>
      )}
    </div>
  );
}