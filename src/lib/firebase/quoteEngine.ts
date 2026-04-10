import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client'; // <-- Fixed Import Path
import { PricingMatrix, SpeciesPricing } from '@/types/only-quotes';
import { GeneratedQuote } from '@/types/quotes';

interface QuoteRequest {
  outfitterId: string;
  hunterId: string;
  days: number;
  hunters: number;
  observers: number;
  targetSpeciesIds: string[]; // e.g., ['kudu-bull', 'impala-southern']
}

export async function generateAutomatedQuote(request: QuoteRequest): Promise<{ success: boolean; quoteId?: string; error?: string }> {
  try {
    // 1. Fetch the Outfitter's locked Pricing Matrix
    const matrixRef = doc(db, 'outfitters', request.outfitterId, 'documents', 'pricing_matrix');
    const matrixSnap = await getDoc(matrixRef);

    if (!matrixSnap.exists()) {
      throw new Error("Outfitter does not have an active pricing matrix.");
    }

    const matrix = matrixSnap.data() as PricingMatrix;
    const lineItems: GeneratedQuote['lineItems'] = [];
    
    // 2. Calculate Base Rates
    // Assuming 2v1 rate is used if there are 2 hunters, otherwise 1v1 rate.
    let applicableHunterRate = request.hunters > 1 && matrix.dailyRates.hunter2v1 
      ? matrix.dailyRates.hunter2v1 
      : matrix.dailyRates.hunter1v1;

    if (!applicableHunterRate) throw new Error("Outfitter is missing base daily rates.");

    const hunterBaseTotal = request.hunters * applicableHunterRate * request.days;
    lineItems.push({
      description: `${request.hunters} Hunter(s) x ${request.days} Days`,
      quantity: request.hunters * request.days,
      unitPrice: applicableHunterRate,
      total: hunterBaseTotal,
    });

    let observerBaseTotal = 0;
    if (request.observers > 0 && matrix.dailyRates.observer) {
      observerBaseTotal = request.observers * matrix.dailyRates.observer * request.days;
      lineItems.push({
        description: `${request.observers} Observer(s) x ${request.days} Days`,
        quantity: request.observers * request.days,
        unitPrice: matrix.dailyRates.observer,
        total: observerBaseTotal,
      });
    }

    const baseRateTotal = hunterBaseTotal + observerBaseTotal;

    // 3. Calculate Trophy Fees
    let trophyFeeTotal = 0;
    // Combine standard and custom species to search for the requested IDs
    const allAvailableSpecies = [...matrix.species, ...matrix.customSpecies];

    request.targetSpeciesIds.forEach(targetId => {
      const foundSpecies = allAvailableSpecies.find(s => s.id === targetId);
      if (foundSpecies && foundSpecies.price) {
        trophyFeeTotal += foundSpecies.price;
        lineItems.push({
          description: `Trophy Fee: ${foundSpecies.name}`,
          quantity: 1,
          unitPrice: foundSpecies.price,
          total: foundSpecies.price,
        });
      }
    });

    const grandTotal = baseRateTotal + trophyFeeTotal;

    // 4. Construct the Final Quote Document
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 14); // Quote valid for 14 days

    const quotePayload = {
      outfitterId: request.outfitterId,
      hunterId: request.hunterId,
      status: 'PENDING_HUNTER_ACCEPTANCE',
      logistics: {
        days: request.days,
        hunters: request.hunters,
        observers: request.observers,
      },
      financials: {
        baseRateTotal,
        trophyFeeTotal,
        totalUsd: grandTotal,
        isVatInclusive: matrix.settings.isVatInclusive,
      },
      lineItems,
      terms: {
        includesAccommodation: matrix.amenities.includesAccommodation,
        includesMeals: matrix.amenities.includesMeals,
        woundedGamePolicyApplies: true, // Hardcoded protection as discussed
      },
      createdAt: serverTimestamp(),
      expiresAt: expiryDate,
    };

    // 5. Save to the central Quotes collection
    const quotesRef = collection(db, 'quotes');
    const newQuoteDoc = await addDoc(quotesRef, quotePayload);

    return { success: true, quoteId: newQuoteDoc.id };

  } catch (error: any) {
    console.error("Engine failed to generate quote:", error);
    return { success: false, error: error.message || "Engine failure." };
  }
}