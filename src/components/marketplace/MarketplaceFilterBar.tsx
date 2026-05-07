"use client";

import { useState } from "react";
import { Search, Globe, Target, DollarSign, SlidersHorizontal, X } from "lucide-react";

const SUPPORTED_COUNTRIES = [
  "South Africa",
  "Namibia",
  "Zimbabwe",
  "Botswana",
  "Mozambique"
];

const SA_HUNTING_SPECIES = [
  "Baboon", "Black Wildebeest", "Blesbok", "Blue Wildebeest", "Bushbuck", "Bushpig", 
  "Cape Buffalo", "Caracal", "Crocodile", "Duiker", "Eland", "Elephant", "Gemsbok", 
  "Giraffe", "Hippo", "Hyena", "Impala", "Jackal", "Klipspringer", "Kudu", "Leopard", 
  "Lion", "Nyala", "Ostrich", "Red Hartebeest", "Reedbuck", "Rhino", "Roan", 
  "Sable", "Springbok", "Steenbok", "Tsessebe", "Warthog", "Waterbuck", "Zebra"
];

interface FilterProps {
  initialSearch?: string;
  initialLocation?: string; // Legacy support
  initialCountry?: string;
  initialPrice?: number | null;
  onFilterUpdate: (filters: { query: string; country: string; location: string; maxPrice: number | null }) => void;
}

export default function MarketplaceFilterBar({ 
  initialSearch = "", 
  initialLocation = "", 
  initialCountry = "",
  initialPrice = null,
  onFilterUpdate 
}: FilterProps) {
  const [query, setQuery] = useState(initialSearch);
  // Fallback to initialLocation if country is empty to handle legacy URLs gracefully
  const [country, setCountry] = useState(initialCountry || initialLocation); 
  const [maxPrice, setMaxPrice] = useState<number | null>(initialPrice);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const handleApply = () => {
    // Clear out the legacy location field when pushing new strict country filters
    onFilterUpdate({ query, country, location: "", maxPrice }); 
    setIsMobileFiltersOpen(false);
  };

  const handleReset = () => {
    setQuery("");
    setCountry("");
    setMaxPrice(null);
    onFilterUpdate({ query: "", country: "", location: "", maxPrice: null });
    setIsMobileFiltersOpen(false);
  };

  return (
    <div className="bg-black/40 border-b border-kalahari/20 sticky top-[72px] z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* DESKTOP BAR */}
        <div className="hidden md:flex items-center gap-4">
          
          {/* Species */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Target className="h-5 w-5 text-kalahari" />
            </div>
            <select
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full pl-10 pr-10 py-3 bg-black/50 border border-kalahari/30 rounded-xl text-off-white focus:outline-none focus:ring-2 focus:ring-kalahari appearance-none cursor-pointer transition-all [&>option]:bg-stone-900"
            >
              <option value="">All Species</option>
              {SA_HUNTING_SPECIES.map(species => (
                <option key={species} value={species}>{species}</option>
              ))}
            </select>
          </div>

          {/* Country */}
          <div className="w-64 relative shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Globe className="h-5 w-5 text-kalahari" />
            </div>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="block w-full pl-10 pr-10 py-3 bg-black/50 border border-kalahari/30 rounded-xl text-off-white focus:outline-none focus:ring-2 focus:ring-kalahari appearance-none cursor-pointer transition-all [&>option]:bg-stone-900"
            >
              <option value="">All Countries</option>
              {SUPPORTED_COUNTRIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Max Price */}
          <div className="w-56 relative shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-kalahari" />
            </div>
            <select
              value={maxPrice || ""}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
              className="block w-full pl-10 pr-10 py-3 bg-black/50 border border-kalahari/30 rounded-xl text-off-white focus:outline-none focus:ring-2 focus:ring-kalahari appearance-none cursor-pointer transition-all [&>option]:bg-stone-900"
            >
              <option value="">Any Price</option>
              <option value="2500">Under $2,500</option>
              <option value="5000">Under $5,000</option>
              <option value="10000">Under $10,000</option>
              <option value="25000">Under $25,000</option>
              <option value="50000">Under $50,000</option>
            </select>
          </div>

          <button 
            onClick={handleApply}
            className="shrink-0 bg-kalahari hover:bg-kalahari/90 text-white font-black px-6 py-3 rounded-xl transition-all shadow-md flex items-center"
          >
            <Search className="h-5 w-5 mr-2" />
            Apply
          </button>
        </div>

        {/* MOBILE FILTER TOGGLE */}
        <div className="md:hidden flex items-center justify-between gap-4">
          <button 
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="flex-1 bg-black/50 border border-kalahari/30 text-off-white font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <SlidersHorizontal className="h-5 w-5 text-kalahari" />
            {isMobileFiltersOpen ? "Hide Filters" : "Filter Packages"}
          </button>
        </div>

        {/* MOBILE EXPANDED FILTERS */}
        {isMobileFiltersOpen && (
          <div className="md:hidden mt-4 space-y-4 pb-2 animate-in slide-in-from-top-4 duration-300">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Target className="h-5 w-5 text-kalahari" />
              </div>
              <select
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 bg-black/50 border border-kalahari/30 rounded-xl text-off-white focus:outline-none focus:ring-2 focus:ring-kalahari appearance-none [&>option]:bg-stone-900"
              >
                <option value="">All Species</option>
                {SA_HUNTING_SPECIES.map(species => (
                  <option key={species} value={species}>{species}</option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-kalahari" />
              </div>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 bg-black/50 border border-kalahari/30 rounded-xl text-off-white focus:outline-none focus:ring-2 focus:ring-kalahari appearance-none [&>option]:bg-stone-900"
              >
                <option value="">All Countries</option>
                {SUPPORTED_COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-kalahari" />
              </div>
              <select
                value={maxPrice || ""}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
                className="block w-full pl-10 pr-10 py-3 bg-black/50 border border-kalahari/30 rounded-xl text-off-white focus:outline-none focus:ring-2 focus:ring-kalahari appearance-none [&>option]:bg-stone-900"
              >
                <option value="">Any Price</option>
                <option value="2500">Under $2,500</option>
                <option value="5000">Under $5,000</option>
                <option value="10000">Under $10,000</option>
                <option value="25000">Under $25,000</option>
                <option value="50000">Under $50,000</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleReset}
                className="w-1/3 bg-black/50 border border-kalahari/30 text-off-white font-bold px-4 py-3 rounded-xl flex justify-center items-center"
              >
                <X className="h-4 w-4 mr-1" /> Clear
              </button>
              <button 
                onClick={handleApply}
                className="w-2/3 bg-kalahari hover:bg-kalahari/90 text-white font-black px-4 py-3 rounded-xl flex items-center justify-center shadow-md transition-all"
              >
                <Search className="h-5 w-5 mr-2" />
                Apply Filters
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}