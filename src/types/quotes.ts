// --- EXISTING AUTO-QUOTE ENGINE TYPES ---
export interface GeneratedQuote {
  id: string; // Unique quote ID
  outfitterId: string;
  hunterId: string;
  status: 'PENDING_HUNTER_ACCEPTANCE' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  
  // Trip Logistics
  logistics: {
    days: number;
    hunters: number;
    observers: number;
  };

  // The Breakdown
  financials: {
    baseRateTotal: number; // (Hunters * Rate * Days) + (Observers * Rate * Days)
    trophyFeeTotal: number; // Sum of requested species
    totalUsd: number; // The final grand total
    isVatInclusive: boolean;
  };

  // Line Items for the UI to display
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];

  // Legal & Timestamps
  terms: {
    includesAccommodation: boolean;
    includesMeals: boolean;
    woundedGamePolicyApplies: boolean;
  };
  createdAt: Date;
  expiresAt: Date; // Usually quotes are valid for 14-30 days
}

// --- NEW CUSTOM INBOX UNIFIED TYPES ---
export interface UnifiedQuote {
  id: string;
  sourceCollection: "quote_requests" | "quotes";
  hunterId: string;
  hunterName?: string;
  status: string;
  createdAt: number;
  targetSpecies: string | string[];
  logistics?: { 
    days: number; 
    hunters: number; 
    observers?: number; 
    startDate?: string; 
    endDate?: string; 
    province?: string; 
  };
  notes?: string;
  totalAmount?: number;
  responseMessage?: string;
  includedItems?: string[];
  excludedItems?: string[];
  financials?: any;
  outfitterArchived?: boolean;
  outfitterRead?: boolean;
}

export interface OutfitterRates {
  dailyRate: number;
  trophyFees: Record<string, number>;
}