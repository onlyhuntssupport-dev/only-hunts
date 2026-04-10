// 1. The Core Outfitter Profile Addition (Handles the PayFast / Gateway logic later)
export interface OutfitterProfile {
    uid: string;
    companyName: string;
    // SaaS Billing Gate
    isPro: boolean; 
    subscriptionStatus: 'FREE' | 'PRO' | 'PAST_DUE';
    subscriptionExpiry: Date | null; 
  }
  
  // 2. The Pricing Matrix Document (Stored in: /outfitters/{uid}/documents/pricing_matrix)
  export interface PricingMatrix {
    outfitterId: string;
    updatedAt: Date; // Firebase Timestamp
    
    // Financial Standards
    settings: {
      currency: 'USD'; // Locked to USD as agreed
      isVatInclusive: boolean;
    };
  
    // Section 1: Base Daily Rates
    dailyRates: {
      hunter1v1: number | null; // 1 Hunter / 1 PH
      hunter2v1: number | null; // 2 Hunters / 1 PH
      observer: number | null;
    };
  
    // Section 2: Amenities (True = Included, False = Extra/Not Available)
    amenities: {
      includesAccommodation: boolean;
      includesMeals: boolean;
      includesLocalDrinks: boolean;
      includesFieldPrep: boolean;
      airportTransferFee: number | null; // Value in USD if applicable
    };
  
    // Section 3: The Species Grid
    species: SpeciesPricing[];
    customSpecies: SpeciesPricing[]; // The fallback for color variants/unique game
  
    // Section 4: The Immutable Liability Shield
    legalDisclaimer: {
      hasAccepted: boolean;
      signatureName: string; // The typed digital signature
      acceptedAt: Date; // Firebase Timestamp
      ipAddress?: string; // Optional: extra layer of legal security
    };
  }
  
  // 3. Helper Type for the Grid
  export interface SpeciesPricing {
    id: string; // e.g., 'kudu-bull'
    name: string; // e.g., 'Kudu (Bull)'
    price: number | null; // Value in USD
  }
  
  // 4. Pre-populated Master List (First 5 shown as example)
  export const MASTER_SPECIES_LIST: Omit<SpeciesPricing, 'price'>[] = [
    { id: 'blesbok-common', name: 'Blesbok (Common)' },
    { id: 'buffalo-cape', name: 'Buffalo (Cape)' },
    { id: 'eland-cape', name: 'Eland (Cape)' },
    { id: 'gemsbok', name: 'Gemsbok / Oryx' },
    { id: 'impala-southern', name: 'Impala (Southern)' },
    // ... remaining 35 standard species
  ];