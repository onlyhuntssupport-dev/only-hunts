"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, DollarSign, Target, X, Globe } from "lucide-react";

const SUPPORTED_COUNTRIES = [
  "South Africa",
  "Namibia",
  "Zimbabwe",
  "Botswana",
  "Mozambique"
];

// Includes Elephant, Leopard, Rhino, and standardized Cape Buffalo.
const SA_HUNTING_SPECIES = [
  "Baboon", "Black Wildebeest", "Blesbok", "Blue Wildebeest", "Bushbuck", "Bushpig", 
  "Cape Buffalo", "Caracal", "Crocodile", "Duiker", "Eland", "Elephant", "Gemsbok", 
  "Giraffe", "Hippo", "Hyena", "Impala", "Jackal", "Klipspringer", "Kudu", "Leopard", 
  "Lion", "Nyala", "Ostrich", "Red Hartebeest", "Reedbuck", "Rhino", "Roan", 
  "Sable", "Springbok", "Steenbok", "Tsessebe", "Warthog", "Waterbuck", "Zebra"
];

export default function MarketplaceSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [country, setCountry] = useState(searchParams.get("country") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("price") || "");

  const updateSearch = useCallback((newQuery: string, newCountry: string, newPrice: string) => {
    const params = new URLSearchParams();
    if (newQuery.trim()) params.set("q", newQuery.trim());
    if (newCountry.trim()) params.set("country", newCountry.trim());
    if (newPrice.trim()) params.set("price", newPrice.trim());
    
    // Routes to the root page so the dynamic SearchResultsGrid takes over
    router.push(`/?${params.toString()}`);
  }, [router]);

  const handleClear = () => {
    setQuery("");
    setCountry("");
    setMaxPrice("");
    // Clears filters and resets the homepage view
    router.push(`/`);
  };

  // Check for active filters (including legacy 'loc' for backward compatibility on old links)
  const hasActiveFilters = searchParams.get("q") || searchParams.get("country") || searchParams.get("price") || searchParams.get("loc");

  return (
    // THE DYNAMIC MARGIN FIX
    <div className={hasActiveFilters 
      ? "w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pt-28 pb-8" 
      : "w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-16"
    }>
      
      {/* MAIN SEARCH CONSOLE */}
      <div className="bg-white dark:bg-black/40 backdrop-blur-sm rounded-3xl shadow-2xl dark:shadow-black/50 border border-kalahari/20 dark:border-kalahari/30 overflow-hidden flex flex-col md:flex-row divide-y-2 md:divide-y-0 md:divide-x-2 divide-kalahari/10 dark:divide-kalahari/20 transition-colors duration-300">
        
        {/* 1. Species */}
        <div className="flex-1 relative group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
          <label className="text-[10px] font-black text-olive dark:text-off-white/50 uppercase tracking-widest absolute top-3 left-14 transition-colors">Target Species</label>
          <Target className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-kalahari group-hover:scale-110 transition-transform" />
          <select 
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              updateSearch(val, country, maxPrice);
            }}
            className="w-full h-20 pl-14 pr-8 pt-5 bg-transparent border-none focus:ring-0 outline-none font-bold text-olive dark:text-off-white text-lg appearance-none cursor-pointer [&>option]:bg-white [&>option]:dark:bg-olive"
          >
            <option value="">Any Species</option>
            {SA_HUNTING_SPECIES.map(species => (
              <option key={species} value={species}>{species}</option>
            ))}
          </select>
        </div>

        {/* 2. Country */}
        <div className="flex-1 relative group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
          <label className="text-[10px] font-black text-olive dark:text-off-white/50 uppercase tracking-widest absolute top-3 left-14 transition-colors">Country</label>
          <Globe className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-kalahari group-hover:scale-110 transition-transform" />
          <select 
            value={country}
            onChange={(e) => {
              const val = e.target.value;
              setCountry(val);
              updateSearch(query, val, maxPrice);
            }}
            className="w-full h-20 pl-14 pr-8 pt-5 bg-transparent border-none focus:ring-0 outline-none font-bold text-olive dark:text-off-white text-lg appearance-none cursor-pointer [&>option]:bg-white [&>option]:dark:bg-olive"
          >
            <option value="">Any Country</option>
            {SUPPORTED_COUNTRIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* 3. Budget */}
        <div className="flex-1 relative group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
          <label className="text-[10px] font-black text-olive dark:text-off-white/50 uppercase tracking-widest absolute top-3 left-14 transition-colors">Max Budget (USD)</label>
          <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-kalahari group-hover:scale-110 transition-transform" />
          <select 
            value={maxPrice}
            onChange={(e) => {
              const val = e.target.value;
              setMaxPrice(val);
              updateSearch(query, country, val);
            }}
            className="w-full h-20 pl-14 pr-8 pt-5 bg-transparent border-none focus:ring-0 outline-none font-bold text-olive dark:text-off-white text-lg appearance-none cursor-pointer [&>option]:bg-white [&>option]:dark:bg-olive"
          >
            <option value="">Any Price</option>
            <option value="3000">Under $3,000</option>
            <option value="7000">Under $7,000</option>
            <option value="15000">Under $15,000</option>
            <option value="30000">Under $30,000</option>
            <option value="50000">Under $50,000</option>
          </select>
        </div>

        {/* Mobile Clear Button */}
        {hasActiveFilters && (
          <div className="md:hidden p-3 bg-red-50 dark:bg-red-900/30 flex justify-center transition-colors">
            <button onClick={handleClear} className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center">
              <X className="h-4 w-4 mr-1" /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* CLEAR BUTTON ROW (Desktop) */}
      {hasActiveFilters && (
        <div className="mt-3 flex justify-end px-2">
          <button 
            onClick={handleClear}
            className="hidden md:flex items-center text-xs font-bold text-olive dark:text-off-white/50 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <X className="h-4 w-4 mr-1" /> Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}