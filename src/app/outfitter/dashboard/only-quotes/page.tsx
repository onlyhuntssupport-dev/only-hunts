"use client";

import { useState, useEffect } from "react";
import { savePricingMatrix } from "@/lib/firebase/onlyQuotesService";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { Save, Calculator, Plus, Trash2, X, DollarSign, CheckCircle, ShieldCheck, FileText } from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";

const MASTER_SPECIES_LIST = [
  { id: 'kudu-bull', name: 'Kudu (Bull)' }, { id: 'kudu-cow', name: 'Kudu (Cow)' },
  { id: 'impala-ram', name: 'Impala (Ram)' }, { id: 'impala-ewe', name: 'Impala (Ewe)' },
  { id: 'gemsbok', name: 'Gemsbok / Oryx' }, { id: 'springbok-common', name: 'Springbok (Common)' },
  { id: 'springbok-black', name: 'Springbok (Black)' }, { id: 'springbok-white', name: 'Springbok (White)' },
  { id: 'springbok-copper', name: 'Springbok (Copper)' }, { id: 'wildebeest-blue', name: 'Blue Wildebeest' },
  { id: 'wildebeest-golden', name: 'Golden Wildebeest' }, { id: 'wildebeest-black', name: 'Black Wildebeest' },
  { id: 'blesbok-common', name: 'Blesbok (Common)' }, { id: 'blesbok-white', name: 'Blesbok (White)' },
  { id: 'zebra-burchell', name: 'Zebra (Burchell)' }, { id: 'zebra-hartmann', name: 'Zebra (Hartmann)' },
  { id: 'eland-cape', name: 'Eland (Cape)' }, { id: 'eland-livingstone', name: 'Eland (Livingstone)' },
  { id: 'waterbuck', name: 'Waterbuck' }, { id: 'nyala', name: 'Nyala' },
  { id: 'sable', name: 'Sable Antelope' }, { id: 'roan', name: 'Roan Antelope' },
  { id: 'red-hartebeest', name: 'Red Hartebeest' }, { id: 'bushbuck', name: 'Bushbuck' },
  { id: 'warthog', name: 'Warthog' }, { id: 'giraffe', name: 'Giraffe' },
  { id: 'ostrich', name: 'Ostrich' }, { id: 'leopard', name: 'Leopard' },
  { id: 'lion', name: 'Lion' }, { id: 'buffalo', name: 'Cape Buffalo' },
  { id: 'elephant', name: 'Elephant' }, { id: 'rhino', name: 'Rhino' },
  { id: 'hippo', name: 'Hippo' }, { id: 'crocodile', name: 'Crocodile' },
  { id: 'steenbok', name: 'Steenbok' }, { id: 'duiker', name: 'Duiker' },
  { id: 'klipspringer', name: 'Klipspringer' }, { id: 'hyena', name: 'Hyena' },
  { id: 'jackal', name: 'Jackal' }, { id: 'baboon', name: 'Baboon' }
];

export default function OnlyQuotesSetupPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // --- MATRIX STATE ---
  const [dailyRates, setDailyRates] = useState({ hunter1v1: 0, hunter2v1: 0, observer: 0 });
  const [speciesPrices, setSpeciesPrices] = useState<Record<string, number>>({});
  const [customSpecies, setCustomSpecies] = useState<{ id: string, name: string, price: number }[]>([]);
  const [settings, setSettings] = useState({ isVatInclusive: false });

  // --- PREMIUM TERMS BUILDER STATE ---
  const [inclusions, setInclusions] = useState({
    accommodation: true,
    meals: true,
    localDrinks: true,
    laundry: true,
    phAndTrackers: true,
    huntingVehicle: true,
    fieldPrep: true,
    airportTransfer: false, 
  });
  
  const [exclusions, setExclusions] = useState({
    flights: true,
    taxidermy: true,
    gratuities: true,
    accommodationBeforeAfter: true,
  });

  const [policies, setPolicies] = useState({
    deposit: "A 50% deposit of the daily rates is required to secure your dates.",
    cancellation: "Deposits are non-refundable. Cancellations made 90 days prior can be rolled over to the following season.",
    wounded: "Wounded game is considered harvested and must be paid for in full before departure."
  });

  // --- CONTEXTUAL CALCULATOR STATE ---
  const [activeCalcId, setActiveCalcId] = useState<string | null>(null);
  const [zarInput, setZarInput] = useState("");
  const exchangeRate = 18.5;

  // --- HYDRATION: FETCH EXISTING DATA ON LOAD ---
  useEffect(() => {
    const fetchMatrix = async (user: any) => {
      try {
        // Path aligned perfectly with the service file's architecture
        const docRef = doc(db, 'outfitters', user.uid, 'documents', 'pricing_matrix');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          if (data.dailyRates) setDailyRates(data.dailyRates);
          
          if (data.species && Array.isArray(data.species)) {
            const loadedPrices: Record<string, number> = {};
            data.species.forEach((s) => {
              loadedPrices[s.id] = s.price;
            });
            setSpeciesPrices(loadedPrices);
          }
          
          if (data.customSpecies) setCustomSpecies(data.customSpecies);
          if (data.settings) setSettings(data.settings);
          if (data.inclusions) setInclusions(data.inclusions);
          if (data.exclusions) setExclusions(data.exclusions);
          if (data.policies) setPolicies(data.policies);
        }
      } catch (error) {
        console.error("Error fetching pricing matrix:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchMatrix(user);
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handlePriceChange = (id: string, value: string) => {
    const num = parseInt(value) || 0;
    setSpeciesPrices(prev => ({ ...prev, [id]: num }));
  };

  const addCustomSpecies = () => setCustomSpecies([...customSpecies, { id: `custom_${Date.now()}`, name: "", price: 0 }]);
  const updateCustomSpecies = (id: string, field: 'name' | 'price', value: string) => {
    setCustomSpecies(prev => prev.map(cs => cs.id === id ? { ...cs, [field]: field === 'price' ? (parseInt(value) || 0) : value } : cs));
  };
  const removeCustomSpecies = (id: string) => setCustomSpecies(prev => prev.filter(cs => cs.id !== id));

  const InlineCalculator = ({ fieldId, onApply }: { fieldId: string, onApply: (usd: number) => void }) => {
    if (activeCalcId !== fieldId) return null;
    const usdResult = Math.round((parseInt(zarInput) || 0) / exchangeRate);

    return (
      <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">ZAR to USD Converter</span>
          <button type="button" onClick={() => setActiveCalcId(null)} className="text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-gray-400 font-bold">R</span>
          <input 
            type="number" autoFocus placeholder="Enter ZAR..." value={zarInput} 
            onChange={(e) => setZarInput(e.target.value)}
            className="w-full bg-gray-800 text-white rounded outline-none px-2 py-1 focus:ring-1 focus:ring-kalahari"
          />
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-700">
          <span className="font-bold text-kalahari">${usdResult.toLocaleString()}</span>
          <button 
            type="button"
            onClick={() => { onApply(usdResult); setActiveCalcId(null); setZarInput(""); }}
            className="bg-kalahari text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-kalahari/90 transition-colors"
          >
            Apply Price
          </button>
        </div>
      </div>
    );
  };

  const handleSave = async () => {
    if (!auth.currentUser) return alert("You must be logged in.");
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        outfitterId: auth.currentUser.uid,
        dailyRates,
        species: MASTER_SPECIES_LIST.map(s => ({ id: s.id, name: s.name, price: speciesPrices[s.id] || 0 })).filter(s => s.price > 0),
        customSpecies: customSpecies.filter(cs => cs.name && cs.price > 0),
        settings,
        inclusions,
        exclusions,
        policies
      };

      const result = await savePricingMatrix(auth.currentUser.uid, payload);
      
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("Error saving: " + result.error);
      }
    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <KuduLoader />;

  return (
    <div className="min-h-screen bg-off-white dark:bg-olive transition-colors duration-300 pb-16">
      
      <div className="bg-olive dark:bg-black/30 pt-12 pb-12 border-b-4 border-kalahari transition-colors">
        <div className="max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-1.5 bg-kalahari/20 text-kalahari border border-kalahari/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 shadow-sm">
            <ShieldCheck className="h-3 w-3" /> Pro Feature
          </div>
          <h1 className="text-3xl md:text-4xl font-black font-headline text-off-white tracking-tight flex items-center gap-3">
            <Calculator className="h-8 w-8 text-kalahari" /> Only-Quotes Engine
          </h1>
          <p className="text-off-white/70 mt-2 font-medium">
            Set your base USD pricing and logistics below. When a hunter requests a custom itinerary, the system will use this matrix to automatically generate and send a binding, professional quote.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8 space-y-8">
        
        {/* SECTION 1: DAILY RATES */}
        <section className="bg-white dark:bg-black/20 border-2 border-kalahari/20 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-black text-olive dark:text-off-white border-b-2 border-kalahari/20 pb-3 mb-6">Base Daily Rates (USD)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-olive/70 dark:text-off-white/70 mb-2">1 Hunter x 1 PH</label>
              <div className="relative flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-kalahari transition-all">
                <DollarSign className="h-5 w-5 text-gray-400 ml-3 shrink-0" />
                <input type="number" value={dailyRates.hunter1v1 || ''} onChange={(e) => setDailyRates({...dailyRates, hunter1v1: parseInt(e.target.value) || 0})} className="w-full bg-transparent text-olive dark:text-white p-3 outline-none font-bold" placeholder="0" />
                <button type="button" onClick={() => { setActiveCalcId('hunter1v1'); setZarInput(""); }} className="p-3 text-kalahari hover:bg-kalahari/10 transition-colors border-l border-gray-200 dark:border-gray-700"><Calculator className="h-5 w-5" /></button>
                <InlineCalculator fieldId="hunter1v1" onApply={(usd) => setDailyRates({...dailyRates, hunter1v1: usd})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-olive/70 dark:text-off-white/70 mb-2">2 Hunters x 1 PH</label>
              <div className="relative flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-kalahari transition-all">
                <DollarSign className="h-5 w-5 text-gray-400 ml-3 shrink-0" />
                <input type="number" value={dailyRates.hunter2v1 || ''} onChange={(e) => setDailyRates({...dailyRates, hunter2v1: parseInt(e.target.value) || 0})} className="w-full bg-transparent text-olive dark:text-white p-3 outline-none font-bold" placeholder="0" />
                <button type="button" onClick={() => { setActiveCalcId('hunter2v1'); setZarInput(""); }} className="p-3 text-kalahari hover:bg-kalahari/10 transition-colors border-l border-gray-200 dark:border-gray-700"><Calculator className="h-5 w-5" /></button>
                <InlineCalculator fieldId="hunter2v1" onApply={(usd) => setDailyRates({...dailyRates, hunter2v1: usd})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-olive/70 dark:text-off-white/70 mb-2">Non-Hunter (Observer)</label>
              <div className="relative flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-kalahari transition-all">
                <DollarSign className="h-5 w-5 text-gray-400 ml-3 shrink-0" />
                <input type="number" value={dailyRates.observer || ''} onChange={(e) => setDailyRates({...dailyRates, observer: parseInt(e.target.value) || 0})} className="w-full bg-transparent text-olive dark:text-white p-3 outline-none font-bold" placeholder="0" />
                <button type="button" onClick={() => { setActiveCalcId('observer'); setZarInput(""); }} className="p-3 text-kalahari hover:bg-kalahari/10 transition-colors border-l border-gray-200 dark:border-gray-700"><Calculator className="h-5 w-5" /></button>
                <InlineCalculator fieldId="observer" onApply={(usd) => setDailyRates({...dailyRates, observer: usd})} />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: TROPHY FEES */}
        <section className="bg-white dark:bg-black/20 border-2 border-kalahari/20 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-end border-b-2 border-kalahari/20 pb-3 mb-6">
            <div>
              <h2 className="text-xl font-black text-olive dark:text-off-white">Trophy Fees (USD)</h2>
              <p className="text-sm text-olive/60 dark:text-off-white/50 font-medium mt-1">Leave blank if you do not offer the species.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {MASTER_SPECIES_LIST.map((species) => (
              <div key={species.id} className="flex items-center justify-between py-2 border-b border-kalahari/10">
                <span className="font-bold text-olive dark:text-off-white">{species.name}</span>
                <div className="relative flex items-center w-36 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus-within:ring-1 focus-within:ring-kalahari">
                  <span className="text-gray-400 ml-2 font-bold">$</span>
                  <input type="number" value={speciesPrices[species.id] || ''} onChange={(e) => handlePriceChange(species.id, e.target.value)} className="w-full bg-transparent text-olive dark:text-white p-2 outline-none font-bold text-right" placeholder="0" />
                  <button type="button" onClick={() => { setActiveCalcId(species.id); setZarInput(""); }} className="p-2 text-kalahari hover:bg-kalahari/10 border-l border-gray-200 dark:border-gray-700"><Calculator className="h-4 w-4" /></button>
                  <InlineCalculator fieldId={species.id} onApply={(usd) => setSpeciesPrices({...speciesPrices, [species.id]: usd})} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: CUSTOM SPECIES */}
        <section className="bg-white dark:bg-black/20 border-2 border-kalahari/20 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-black text-olive dark:text-off-white border-b-2 border-kalahari/20 pb-3 mb-6">Custom Species & Exotics</h2>
          <div className="space-y-4 mb-6">
            {customSpecies.length === 0 && <p className="text-sm text-olive/60 dark:text-off-white/50 font-medium italic">No custom species added yet.</p>}
            {customSpecies.map((cs) => (
              <div key={cs.id} className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                <input type="text" placeholder="e.g. Golden Wildebeest" value={cs.name} onChange={(e) => updateCustomSpecies(cs.id, 'name', e.target.value)} className="w-full sm:flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-olive dark:text-white rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-kalahari font-bold" />
                <div className="w-full sm:w-48 relative flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus-within:ring-1 focus-within:ring-kalahari shrink-0">
                  <span className="text-gray-400 ml-2 font-bold">$</span>
                  <input type="number" placeholder="0" value={cs.price || ''} onChange={(e) => updateCustomSpecies(cs.id, 'price', e.target.value)} className="w-full bg-transparent text-olive dark:text-white p-2.5 outline-none font-bold text-right" />
                  <button type="button" onClick={() => { setActiveCalcId(cs.id); setZarInput(""); }} className="p-2.5 text-kalahari hover:bg-kalahari/10 border-l border-gray-200 dark:border-gray-700"><Calculator className="h-4 w-4" /></button>
                  <InlineCalculator fieldId={cs.id} onApply={(usd) => updateCustomSpecies(cs.id, 'price', usd.toString())} />
                </div>
                <button type="button" onClick={() => removeCustomSpecies(cs.id)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Remove"><Trash2 className="h-5 w-5" /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addCustomSpecies} className="flex items-center text-sm font-bold text-kalahari hover:text-kalahari/80 bg-kalahari/10 px-4 py-2 rounded-lg transition-colors">
            <Plus className="h-4 w-4 mr-2" /> Add Custom Species
          </button>
        </section>

        {/* SECTION 4: PREMIUM TERMS BUILDER */}
        <section className="bg-white dark:bg-black/20 border-2 border-kalahari/20 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-kalahari/10 border-b border-kalahari/20 p-6">
            <h2 className="text-xl font-black text-olive dark:text-off-white flex items-center gap-2 mb-1">
              <FileText className="h-6 w-6 text-kalahari" /> Logistics & Terms Builder
            </h2>
            <p className="text-sm text-olive/70 dark:text-off-white/60 font-medium">
              Define exactly what is included in your daily rates. This will be beautifully formatted on the Hunter's final quote PDF to protect your business and prevent disputes.
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Column 1: Standard Inclusions */}
            <div className="space-y-4">
              <h3 className="font-bold text-olive dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">Included in Daily Rate</h3>
              {Object.keys(inclusions).map((key) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={inclusions[key as keyof typeof inclusions]}
                    onChange={(e) => setInclusions({...inclusions, [key]: e.target.checked})}
                    className="h-5 w-5 rounded border-gray-300 text-kalahari focus:ring-kalahari bg-gray-50 dark:bg-gray-800"
                  />
                  <span className="text-sm text-olive/80 dark:text-off-white/80 font-bold group-hover:text-kalahari transition-colors capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>

            {/* Column 2: Standard Exclusions */}
            <div className="space-y-4">
              <h3 className="font-bold text-olive dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">Explicitly Excluded</h3>
              {Object.keys(exclusions).map((key) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={exclusions[key as keyof typeof exclusions]}
                    onChange={(e) => setExclusions({...exclusions, [key]: e.target.checked})}
                    className="h-5 w-5 rounded border-gray-300 text-red-500 focus:ring-red-500 bg-gray-50 dark:bg-gray-800"
                  />
                  <span className="text-sm text-olive/80 dark:text-off-white/80 font-bold group-hover:text-red-500 transition-colors capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>

            {/* Column 3: VAT & Taxes */}
            <div className="space-y-4">
              <h3 className="font-bold text-olive dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">Pricing Structure</h3>
              <label className="flex items-start gap-3 cursor-pointer group bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                <input 
                  type="checkbox" 
                  checked={settings.isVatInclusive}
                  onChange={(e) => setSettings({...settings, isVatInclusive: e.target.checked})}
                  className="h-5 w-5 mt-0.5 rounded border-gray-300 text-kalahari focus:ring-kalahari"
                />
                <div>
                  <span className="block text-sm text-olive dark:text-white font-bold group-hover:text-kalahari transition-colors">
                    15% VAT Inclusive
                  </span>
                  <span className="block text-xs text-olive/60 dark:text-off-white/50 mt-1">Check this if your USD prices above already include South African VAT.</span>
                </div>
              </label>
            </div>

          </div>

          {/* The Fine Print */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 space-y-6">
            <h3 className="font-bold text-olive dark:text-white mb-2">The Fine Print (Policies)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase tracking-wide mb-2">Deposit Policy</label>
                <textarea 
                  value={policies.deposit}
                  onChange={(e) => setPolicies({...policies, deposit: e.target.value})}
                  className="w-full h-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari font-medium resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase tracking-wide mb-2">Cancellation Policy</label>
                <textarea 
                  value={policies.cancellation}
                  onChange={(e) => setPolicies({...policies, cancellation: e.target.value})}
                  className="w-full h-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari font-medium resize-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase tracking-wide mb-2">Wounded Game Policy</label>
                <textarea 
                  value={policies.wounded}
                  onChange={(e) => setPolicies({...policies, wounded: e.target.value})}
                  className="w-full h-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari font-medium resize-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SAVE BAR (Fixed to bottom, not floating) */}
        <div className="mt-8 bg-white dark:bg-gray-900 border-2 border-kalahari/30 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
          <div className="text-olive/70 dark:text-gray-400 text-sm font-bold text-center sm:text-left">
            Remember to save your changes to update live quotes.
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto bg-kalahari hover:bg-kalahari/90 text-white font-black px-10 py-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            {isSaving ? (
              "Saving to Cloud..."
            ) : saveSuccess ? (
              <><CheckCircle className="h-5 w-5" /> Saved Successfully</>
            ) : (
              <><Save className="h-5 w-5" /> Lock In Pricing & Terms</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}