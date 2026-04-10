'use client';

import { useState } from 'react';
import { MASTER_SPECIES_LIST } from '@/types/only-quotes'; // Pulls the exact same list the Outfitter used

interface CustomQuoteModalProps {
  outfitterId: string;
  outfitterName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomQuoteModal({ outfitterId, outfitterName, isOpen, onClose }: CustomQuoteModalProps) {
  // Trip Details State
  const [days, setDays] = useState<number | ''>('');
  const [hunters, setHunters] = useState<number>(1);
  const [observers, setObservers] = useState<number>(0);
  
  // Species Selection State
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSpecies = (speciesId: string) => {
    setSelectedSpecies((prev) => 
      prev.includes(speciesId) 
        ? prev.filter((id) => id !== speciesId) 
        : [...prev, speciesId]
    );
  };

  const handleRequestQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In Module 6, we will wire this to a Firebase Cloud Function that:
      // 1. Reads the Hunter's request here.
      // 2. Cross-references the Outfitter's PricingMatrix (Module 1).
      // 3. Generates the final PDF/UI proposal.
      
      const payload = {
        outfitterId,
        days: Number(days),
        partySize: { hunters, observers },
        targetSpecies: selectedSpecies,
        requestedAt: new Date(),
      };

      console.log("Sending Quote Request to Engine:", payload);
      
      // Simulating network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert("Success! Your custom quote has been generated and sent to your inbox.");
      onClose();
    } catch (error) {
      console.error("Failed to request quote", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900 p-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Build Custom Safari</h2>
            <p className="text-sm text-gray-400">Requesting automated quote from {outfitterName}</p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleRequestQuote} className="p-6 space-y-8">
          
          {/* SECTION 1: Logistics */}
          <section>
            <h3 className="mb-4 text-lg font-semibold text-orange-500">1. Trip Logistics</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Total Days</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={days}
                  onChange={(e) => setDays(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded bg-gray-800 p-3 text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" 
                  placeholder="e.g. 7" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Number of Hunters</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={hunters}
                  onChange={(e) => setHunters(Number(e.target.value))}
                  className="w-full rounded bg-gray-800 p-3 text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Number of Observers</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={observers}
                  onChange={(e) => setObservers(Number(e.target.value))}
                  className="w-full rounded bg-gray-800 p-3 text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" 
                />
              </div>
            </div>
          </section>

          {/* SECTION 2: Species Selection */}
          <section>
            <h3 className="mb-4 text-lg font-semibold text-orange-500">2. Target Species</h3>
            <p className="mb-4 text-sm text-gray-400">Select the primary animals you wish to hunt. The automated quote will include these trophy fees.</p>
            
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-60 overflow-y-auto rounded-lg border border-gray-800 bg-gray-950 p-4">
              {MASTER_SPECIES_LIST.map((species) => (
                <label 
                  key={species.id} 
                  className={`flex cursor-pointer items-center space-x-3 rounded p-2 transition-colors ${
                    selectedSpecies.includes(species.id) ? 'bg-orange-500/10 border border-orange-500/50' : 'hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedSpecies.includes(species.id)}
                    onChange={() => toggleSpecies(species.id)}
                    className="h-4 w-4 rounded text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-200">{species.name}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-800">
            <button 
              type="submit" 
              disabled={isSubmitting || days === '' || Number(days) <= 0}
              className="w-full rounded-lg bg-orange-600 py-4 font-bold text-white transition-all hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-400"
            >
              {isSubmitting ? "Drafting Proposal..." : "Generate Custom Quote"}
            </button>
            <p className="mt-3 text-center text-xs text-gray-500">
              Generating a quote is free and does not commit you to a booking.
            </p>
          </div>

        </form>
      </div>
    </div>
  );
}