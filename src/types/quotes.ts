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