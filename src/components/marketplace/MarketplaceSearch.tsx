"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, DollarSign, Target, X } from "lucide-react";

const POPULAR_SPECIES = ["Kudu", "Buffalo", "Lion", "Sable", "Impala", "Gemsbok"];

const SA_PROVINCES = [
  "Limpopo",
  "Eastern Cape",
  "Western Cape",
  "Northern Cape",
  "Free State",
  "KwaZulu-Natal",
  "North West",
  "Mpumalanga"
];

const SA_HUNTING_SPECIES = [
  "Baboon", "Blesbok", "Black Wildebeest", "Blue Wildebeest", "Buffalo",
  "Bushbuck", "Bushpig", "Caracal", "Crocodile", "Duiker", "Eland",
  "Gemsbok", "Giraffe", "Hippo", "Hyena", "Impala", "Jackal", "Klipspringer",
  "Kudu", "Lion", "Nyala", "Ostrich", "Red Hartebeest", "Reedbuck", "Roan",
  "Sable", "Springbok", "Steenbok", "Tsessebe", "Warthog", "Waterbuck", "Zebra"
];

export default function MarketplaceSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("loc") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("price") || "");

  const updateSearch = useCallback((newQuery: string, newLoc: string, newPrice: string) => {
    const params = new URLSearchParams();
    if (newQuery.trim()) params.set("q", newQuery.trim());
    if (newLoc.trim()) params.set("loc", newLoc.trim());
    if (newPrice.trim()) params.set("price", newPrice.trim());
    router.push(`/?${params.toString()}#marketplace`, { scroll: false });
  }, [router]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (
        query !== (searchParams.get("q") || "") ||
        location !== (searchParams.get("loc") || "") ||
        maxPrice !== (searchParams.get("price") || "")
      ) {
        updateSearch(query, location, maxPrice);
      }
    }, 100); 
    return () => clearTimeout(delayDebounceFn);
  }, [query, location, maxPrice, updateSearch, searchParams]);

  const handleClear = () => {
    setQuery("");
    setLocation("");
    setMaxPrice("");
    router.push(`/#marketplace`, { scroll: false });
  };

  const hasActiveFilters = searchParams.get("q") || searchParams.get("loc") || searchParams.get("price");

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
      
      {/* MAIN SEARCH CONSOLE */}
      <div className="bg-white dark:bg-black/40 backdrop-blur-sm rounded-3xl shadow-2xl dark:shadow-black/50 border border-kalahari/20 dark:border-kalahari/30 overflow-hidden flex flex-col md:flex-row divide-y-2 md:divide-y-0 md:divide-x-2 divide-kalahari/10 dark:divide-kalahari/20 transition-colors duration-300">
        
        {/* 1. Species */}
        <div className="flex-1 relative group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
          <label className="text-[10px] font-black text-olive dark:text-off-white/50 dark:text-off-white/40 uppercase tracking-widest absolute top-3 left-14 transition-colors">Target Species</label>
          <Target className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-kalahari group-hover:scale-110 transition-transform" />
          <select 
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              updateSearch(e.target.value, location, maxPrice);
            }}
            className="w-full h-20 pl-14 pr-8 pt-5 bg-transparent border-none focus:ring-0 outline-none font-bold text-olive dark:text-off-white dark:text-off-white text-lg appearance-none cursor-pointer [&>option]:bg-white [&>option]:dark:bg-olive"
          >
            <option value="">Any Species</option>
            {SA_HUNTING_SPECIES.map(species => (
              <option key={species} value={species}>{species}</option>
            ))}
          </select>
        </div>

        {/* 2. Location */}
        <div className="flex-1 relative group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
          <label className="text-[10px] font-black text-olive dark:text-off-white/50 dark:text-off-white/40 uppercase tracking-widest absolute top-3 left-14 transition-colors">Location</label>
          <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-kalahari group-hover:scale-110 transition-transform" />
          <select 
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              updateSearch(query, e.target.value, maxPrice);
            }}
            className="w-full h-20 pl-14 pr-8 pt-5 bg-transparent border-none focus:ring-0 outline-none font-bold text-olive dark:text-off-white dark:text-off-white text-lg appearance-none cursor-pointer [&>option]:bg-white [&>option]:dark:bg-olive"
          >
            <option value="">Any Region</option>
            {SA_PROVINCES.map(prov => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
        </div>

        {/* 3. Budget */}
        <div className="flex-1 relative group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
          <label className="text-[10px] font-black text-olive dark:text-off-white/50 dark:text-off-white/40 uppercase tracking-widest absolute top-3 left-14 transition-colors">Max Budget</label>
          <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-kalahari group-hover:scale-110 transition-transform" />
          <select 
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              updateSearch(query, location, e.target.value);
            }}
            className="w-full h-20 pl-14 pr-8 pt-5 bg-transparent border-none focus:ring-0 outline-none font-bold text-olive dark:text-off-white dark:text-off-white text-lg appearance-none cursor-pointer [&>option]:bg-white [&>option]:dark:bg-olive"
          >
            <option value="">Any Price</option>
            <option value="3000">Under $3,000</option>
            <option value="7000">Under $7,000</option>
            <option value="15000">Under $15,000</option>
            <option value="30000">Under $30,000</option>
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

      {/* QUICK FILTER PILLS & CLEAR BUTTON ROW */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 px-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-olive dark:text-off-white/40 dark:text-off-white/40 uppercase tracking-widest mr-2 transition-colors">Popular:</span>
          {POPULAR_SPECIES.map(species => {
            const isActive = query.toLowerCase() === species.toLowerCase();
            return (
              <button
                key={species}
                onClick={() => {
                  const newQuery = isActive ? "" : species;
                  setQuery(newQuery);
                  updateSearch(newQuery, location, maxPrice);
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 transition-all ${
                  isActive 
                  ? "bg-kalahari border-kalahari text-white shadow-md scale-105" 
                  : "bg-white dark:bg-black/30 border-kalahari/20 dark:border-kalahari/30 text-olive dark:text-off-white dark:text-off-white hover:border-kalahari dark:hover:border-kalahari hover:text-kalahari dark:hover:text-kalahari"
                }`}
              >
                {species}
              </button>
            );
          })}
        </div>

        {/* Desktop Clear Button */}
        {hasActiveFilters && (
          <button 
            onClick={handleClear}
            className="hidden md:flex items-center text-xs font-bold text-olive dark:text-off-white/50 dark:text-off-white/40 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <X className="h-4 w-4 mr-1" /> Clear All Filters
          </button>
        )}
      </div>
    </div>
  );
}