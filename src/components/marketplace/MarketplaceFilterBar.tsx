"use client";

import { useState } from "react";
import { Search, MapPin, Target, DollarSign, SlidersHorizontal } from "lucide-react";

interface FilterProps {
  initialSearch?: string;
  initialLocation?: string;
  initialPrice?: number | null;
  onFilterUpdate: (filters: { query: string; location: string; maxPrice: number | null }) => void;
}

export default function MarketplaceFilterBar({ 
  initialSearch = "", 
  initialLocation = "", 
  initialPrice = null,
  onFilterUpdate 
}: FilterProps) {
  const [query, setQuery] = useState(initialSearch);
  const [location, setLocation] = useState(initialLocation);
  const [maxPrice, setMaxPrice] = useState<number | null>(initialPrice);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const handleApply = () => {
    onFilterUpdate({ query, location, maxPrice });
    setIsMobileFiltersOpen(false);
  };

  const handleReset = () => {
    setQuery("");
    setLocation("");
    setMaxPrice(null);
    onFilterUpdate({ query: "", location: "", maxPrice: null });
    setIsMobileFiltersOpen(false);
  };

  return (
    <div className="bg-black/40 border-b border-kalahari/20 sticky top-[72px] z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* DESKTOP BAR */}
        <div className="hidden md:flex items-center gap-4">
          
          {/* Search/Species */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Target className="h-5 w-5 text-kalahari" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search species, outfitter, or package..."
              className="block w-full pl-10 pr-3 py-3 bg-black/50 border border-kalahari/30 rounded-xl text-off-white placeholder-off-white/40 focus:outline-none focus:ring-2 focus:ring-kalahari focus:border-transparent transition-all"
            />
          </div>

          {/* Location */}
          <div className="w-64 relative shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-kalahari" />
            </div>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="block w-full pl-10 pr-10 py-3 bg-black/50 border border-kalahari/30 rounded-xl text-off-white focus:outline-none focus:ring-2 focus:ring-kalahari appearance-none cursor-pointer transition-all"
            >
              <option value="">All Regions</option>
              <option value="limpopo">Limpopo</option>
              <option value="eastern cape">Eastern Cape</option>
              <option value="northern cape">Northern Cape</option>
              <option value="north west">North West</option>
              <option value="free state">Free State</option>
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
              className="block w-full pl-10 pr-10 py-3 bg-black/50 border border-kalahari/30 rounded-xl text-off-white focus:outline-none focus:ring-2 focus:ring-kalahari appearance-none cursor-pointer transition-all"
            >
              <option value="">Any Price</option>
              <option value="2500">Under $2,500</option>
              <option value="5000">Under $5,000</option>
              <option value="10000">Under $10,000</option>
              <option value="25000">Under $25,000</option>
            </select>
          </div>

          <button 
            onClick={handleApply}
            className="shrink-0 bg-kalahari hover:bg-kalahari/90 text-white font-black px-6 py-3 rounded-xl transition-all shadow-md flex items-center"
          >
            <Search className="h-5 w-5 mr-2" />
            Search
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
          <div className="md:hidden mt-4 space-y-4 pb-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Target className="h-5 w-5 text-kalahari" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search species..."
                className="block w-full pl-10 pr-3 py-3 bg-black/50 border border-kalahari/30 rounded-xl text-off-white placeholder-off-white/40 focus:outline-none focus:ring-2 focus:ring-kalahari"
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-kalahari" />
              </div>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 bg-black/50 border border-kalahari/30 rounded-xl text-off-white focus:outline-none focus:ring-2 focus:ring-kalahari appearance-none"
              >
                <option value="">All Regions</option>
                <option value="limpopo">Limpopo</option>
                <option value="eastern cape">Eastern Cape</option>
                <option value="northern cape">Northern Cape</option>
                <option value="north west">North West</option>
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-kalahari" />
              </div>
              <select
                value={maxPrice || ""}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
                className="block w-full pl-10 pr-10 py-3 bg-black/50 border border-kalahari/30 rounded-xl text-off-white focus:outline-none focus:ring-2 focus:ring-kalahari appearance-none"
              >
                <option value="">Any Price</option>
                <option value="2500">Under $2,500</option>
                <option value="5000">Under $5,000</option>
                <option value="10000">Under $10,000</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleReset}
                className="w-1/3 bg-black/50 border border-kalahari/30 text-off-white font-bold px-4 py-3 rounded-xl"
              >
                Clear
              </button>
              <button 
                onClick={handleApply}
                className="w-2/3 bg-kalahari hover:bg-kalahari/90 text-white font-black px-4 py-3 rounded-xl flex items-center justify-center shadow-md"
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