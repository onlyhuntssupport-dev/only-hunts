"use client";

import { useRef, useState, useEffect } from "react";
import { Globe, MapPin, ChevronDown, Check } from "lucide-react";
import { SUPPORTED_COUNTRIES, REGION_DICTIONARY } from "@/lib/config/regions";

interface RegionalSelectorProps {
  baseCountry: string;
  operatingRegions: string[];
  onChange: (updates: { baseCountry?: string; operatingRegions?: string[] }) => void;
}

export default function RegionalSelector({ baseCountry, operatingRegions, onChange }: RegionalSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const availableRegions = REGION_DICTIONARY[baseCountry] || [];

  return (
    <div className="md:col-span-2 space-y-6 pt-6 border-t border-kalahari/20">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-kalahari" />
        <h3 className="text-xl font-black font-headline text-white">Regional Presence</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-xs font-black text-kalahari uppercase mb-2 flex items-center gap-1.5">
            <MapPin className="h-3 w-3" /> Base Country
          </label>
          <select
            value={baseCountry}
            onChange={(e) => onChange({ baseCountry: e.target.value, operatingRegions: [] })}
            className="w-full h-12 px-4 bg-black/40 border border-kalahari/30 rounded-xl text-white font-bold outline-none focus:ring-1 focus:ring-kalahari"
          >
            {SUPPORTED_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs font-black text-kalahari uppercase mb-2">
            Active Concessions / Provinces
          </label>
          <div 
            className="w-full min-h-[48px] px-4 py-3 bg-black/40 border border-kalahari/30 rounded-xl text-white font-bold cursor-pointer flex items-center justify-between outline-none focus:ring-1 focus:ring-kalahari"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="truncate pr-4 text-sm">
              {operatingRegions.length > 0 ? operatingRegions.join(", ") : "Select active regions..."}
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </div>

          {isOpen && (
            <div className="absolute z-50 top-full left-0 mt-2 w-full bg-black/90 backdrop-blur-xl border border-kalahari/40 rounded-xl shadow-2xl py-2 max-h-64 overflow-y-auto custom-scrollbar">
              {availableRegions.map(region => {
                const isSelected = operatingRegions.includes(region);
                return (
                  <div 
                    key={region}
                    onClick={() => {
                      const next = isSelected 
                        ? operatingRegions.filter(r => r !== region) 
                        : [...operatingRegions, region];
                      onChange({ operatingRegions: next });
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <div className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-kalahari border-kalahari" : "border-kalahari/50 bg-black/50"}`}>
                      {isSelected && <Check className="h-3 w-3 text-black font-bold" />}
                    </div>
                    <span className="text-sm font-bold text-white flex-1">{region}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}