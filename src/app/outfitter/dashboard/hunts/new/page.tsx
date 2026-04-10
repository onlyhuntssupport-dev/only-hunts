"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/client";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
// NEW IMPORT: Universal storage helper
import { uploadWithCompression } from "@/lib/firebase/storageHelper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Image as ImageIcon, ArrowLeft, Target, MapPin, DollarSign, Calendar, CheckCircle2, XCircle, PlusCircle, Minus, Plus, X, Flame } from "lucide-react";
import Link from "next/link";

// --- MASTER DATA LISTS ---
const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", 
  "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape", "Multiple / Nationwide"
];

const AFRICAN_ANIMALS = [
  "Baboon", "Blesbok", "Blesbok (White)", "Bontebok", "Buffalo (Cape)", "Bushbuck", "Bushpig", "Caracal", 
  "Crocodile", "Duiker (Common)", "Duiker (Blue)", "Eland", "Elephant", "Gemsbok / Oryx", "Giraffe", 
  "Hartebeest (Red)", "Hippo", "Hyena (Spotted)", "Hyena (Brown)", "Impala", "Impala (Black)", "Jackal", 
  "Klipspringer", "Kudu", "Leopard", "Lion", "Nyala", "Ostrich", "Reedbuck (Common)", "Reedbuck (Mountain)", 
  "Rhino (White)", "Rhino (Black)", "Roan Antelope", "Sable Antelope", "Springbok", "Springbok (Black)", 
  "Springbok (White)", "Springbok (Copper)", "Steenbok", "Tsessebe", "Warthog", "Waterbuck", "Wildebeest (Black)", 
  "Wildebeest (Blue)", "Wildebeest (Golden)", "Zebra (Burchell's)", "Zebra (Hartmann's)"
];

const COMMON_INCLUSIONS = [
  "Licensed Professional Hunter (PH)", "Tracker & Skinner", "Field Preparation of Trophies", 
  "Hunting Vehicle", "Accommodation / Lodging", "All Meals", "Local Beverages (Soft Drinks/Water)", 
  "Alcoholic Beverages (Beer/Wine)", "Daily Laundry Service", "Airport Pick-up/Drop-off", "Hunting Permits & Licenses"
];

const COMMON_EXCLUSIONS = [
  "International Flights", "Domestic Flights", "Taxidermy Fees", "Dipping & Packing", 
  "Shipping of Trophies", "Tips & Gratuities", "Imported / Hard Alcohol", "Rifle Hire & Ammunition", 
  "Travel Insurance", "Pre/Post Safari Accommodation", "CITIES Permits (If Applicable)"
];

export default function CreateHuntPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [outfitterDetails, setOutfitterDetails] = useState({ name: "", logo: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // --- STRUCTURED FORM STATE ---
  const [formData, setFormData] = useState({
    title: "",
    price: 3500,
    duration: 5,
    location: "",
    description: "",
  });

  const [isSpecialOffer, setIsSpecialOffer] = useState(false);
  const [primarySpecies, setPrimarySpecies] = useState<string[]>([]);
  const [includedItems, setIncludedItems] = useState<string[]>([]);
  const [otherInclusions, setOtherInclusions] = useState("");
  const [excludedItems, setExcludedItems] = useState<string[]>([]);
  const [otherExclusions, setOtherExclusions] = useState("");
  const [additionalSpecies, setAdditionalSpecies] = useState<{name: string, price: string}[]>([]);

  useEffect(() => {
    const fetchOutfitter = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setOutfitterDetails({
            name: userDoc.data().companyName || userDoc.data().name,
            logo: userDoc.data().profileImageUrl || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch outfitter details", err);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchOutfitter();
      else router.push("/login");
    });
    return () => unsubscribe();
  }, [router]);

  // --- HANDLERS ---
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const toggleArrayItem = (item: string, array: string[], setArray: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const handleAddAdditionalSpecies = (animalName: string) => {
    if (!animalName || additionalSpecies.find(s => s.name === animalName)) return;
    setAdditionalSpecies([...additionalSpecies, { name: animalName, price: "" }]);
  };
  
  const removeAdditionalSpecies = (animalName: string) => {
    setAdditionalSpecies(additionalSpecies.filter(s => s.name !== animalName));
  };

  const updateAdditionalSpeciesPrice = (animalName: string, price: string) => {
    setAdditionalSpecies(additionalSpecies.map(s => s.name === animalName ? { ...s, price } : s));
  };

  const containsRestrictedContent = (text: string) => {
    const phoneRegex = /(?:[-+() ]*\d){8,}/;
    const urlRegex = /([a-zA-Z0-9\-]+\.(com|co\.za|net|org|info|biz|me|za))|(https?:\/\/)|(www\.)/i;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i;
    return phoneRegex.test(text) || urlRegex.test(text) || emailRegex.test(text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!imageFile) {
      setError("Please upload a cover image for this hunt package.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (primarySpecies.length === 0) {
      setError("Please select at least one primary target species.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const fullTextContent = `${formData.title} ${formData.description} ${otherInclusions} ${otherExclusions}`;
    if (containsRestrictedContent(fullTextContent)) {
      setError("Platform Security: Phone numbers, emails, and website links are strictly prohibited in all fields.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!auth.currentUser) return;
    setSaving(true);

    try {
      const compiledPrimary = primarySpecies.join(", ");
      
      const compiledIncluded = [
        ...includedItems.map(i => `• ${i}`),
        ...(otherInclusions ? [`• ${otherInclusions}`] : [])
      ].join("\n");

      const compiledExcluded = [
        ...excludedItems.map(i => `• ${i}`),
        ...(otherExclusions ? [`• ${otherExclusions}`] : [])
      ].join("\n");

      const compiledAdditional = additionalSpecies.map(s => 
        `• ${s.name} - ${s.price ? '$' + s.price : 'Price on Request'}`
      ).join("\n");

      // 2. Compress & Upload Cover Image
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `hunts/${auth.currentUser.uid}_${Date.now()}.${fileExt}`;
      
      const coverImageUrl = await uploadWithCompression(imageFile, fileName);

      // 3. Save to Firebase 
      await addDoc(collection(db, "hunts"), {
        outfitterId: auth.currentUser.uid,
        outfitterName: outfitterDetails.name,
        outfitterLogo: outfitterDetails.logo,
        title: formData.title,
        price: Number(formData.price),
        duration: Number(formData.duration),
        location: formData.location,
        
        primarySpecies: compiledPrimary,      
        includedItems: compiledIncluded,      
        excludedItems: compiledExcluded,      
        additionalSpecies: compiledAdditional, 
        description: formData.description,
        
        primarySpeciesArray: primarySpecies,
        additionalSpeciesArray: additionalSpecies,
        
        isSpecialOffer: isSpecialOffer,
        saveCount: 0,
        viewCount: 0,
        
        coverImage: coverImageUrl,
        status: "APPROVED", 
        createdAt: new Date().toISOString(),
      });

      router.push("/outfitter/dashboard/hunts");

    } catch (err) {
      console.error("Error saving hunt:", err);
      setError("Failed to create package. Please try again.");
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-kalahari" /></div>;
  }

  return (
    <div className="relative min-h-screen pb-12 pt-6 lg:pt-10 transition-colors duration-300">
      
      {/* INJECTED EXPLORER BACKGROUND */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 dark:opacity-40"
        style={{ backgroundImage: "url('/explorer-map-bg.jpg')" }}
      ></div>

      <div className="relative z-10 space-y-8 max-w-5xl mx-auto px-4 lg:px-0">
        
        <div className="flex items-center gap-4 border-b-2 border-kalahari/30 dark:border-kalahari/20 pb-6 bg-white/50 dark:bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-sm">
          <Link href="/outfitter/dashboard/hunts">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-kalahari/50 dark:border-kalahari/30 text-olive dark:text-off-white hover:bg-kalahari/20 dark:hover:bg-kalahari/20 dark:bg-transparent bg-white/50 dark:bg-transparent">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-headline font-bold text-olive dark:text-off-white tracking-tight transition-colors">Create Package</h1>
            <p className="text-olive/70 dark:text-off-white/70 font-medium transition-colors">Build a structured, premium hunting experience.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50/90 dark:bg-red-900/50 backdrop-blur-md text-red-800 dark:text-red-200 p-4 rounded-lg border border-red-200 dark:border-red-800/50 font-bold shadow-sm transition-colors">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white/95 dark:bg-black/60 backdrop-blur-md border-2 border-kalahari/30 dark:border-kalahari/40 rounded-xl p-6 md:p-10 shadow-xl space-y-12 transition-colors">
          
          {/* Cover Image */}
          <div>
            <h2 className="text-xl font-bold font-headline text-olive dark:text-off-white mb-4 transition-colors">Cover Image</h2>
            <div className="relative w-full h-64 md:h-[400px] bg-kalahari/10 dark:bg-black/40 border-2 border-dashed border-kalahari/40 dark:border-kalahari/30 rounded-xl flex flex-col items-center justify-center overflow-hidden group cursor-pointer hover:bg-kalahari/20 dark:hover:bg-black/60 transition-colors">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-olive/60 dark:text-off-white/60 group-hover:text-olive/80 dark:group-hover:text-off-white/80 transition-colors">
                  <ImageIcon className="h-12 w-12 mb-3" />
                  <span className="font-bold text-lg">Click to upload cover photo</span>
                  <span className="text-sm">High quality landscape image (Max 5MB)</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
          </div>

          {/* Basic Details */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-kalahari/20 dark:border-kalahari/30 pb-2 gap-4">
              <h2 className="text-2xl font-black font-headline text-olive dark:text-off-white transition-colors">Package Details</h2>
            </div>

            {/* Special Offer Toggle */}
            <div 
              onClick={() => setIsSpecialOffer(!isSpecialOffer)}
              className={`border-2 rounded-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer transition-all ${
                isSpecialOffer ? 'bg-orange-50/90 dark:bg-orange-950/60 border-orange-400 dark:border-orange-500 shadow-md' : 'bg-off-white/80 dark:bg-black/40 border-kalahari/30 dark:border-kalahari/40 hover:border-kalahari/60 dark:hover:border-kalahari/60'
              }`}
            >
              <div className="pr-4 mb-4 md:mb-0">
                <h3 className={`text-lg font-black flex items-center gap-2 transition-colors ${isSpecialOffer ? 'text-orange-700 dark:text-orange-400' : 'text-olive dark:text-off-white'}`}>
                  <Flame className={`h-5 w-5 ${isSpecialOffer ? 'text-orange-500' : 'text-kalahari'}`} /> 
                  Last-Minute Cancellation or Special Offer?
                </h3>
                <p className={`text-sm font-medium mt-1 transition-colors ${isSpecialOffer ? 'text-orange-800/80 dark:text-orange-200/80' : 'text-olive/60 dark:text-off-white/60'}`}>
                  Toggle this ON to feature this package on the public Deals page. This is great for filling empty dates fast.
                </p>
              </div>
              
              <div className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out ${isSpecialOffer ? 'bg-orange-500' : 'bg-kalahari/40 dark:bg-kalahari/30'}`}>
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition duration-300 ease-in-out ${isSpecialOffer ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-olive dark:text-off-white mb-2 transition-colors">Package Title</label>
              <Input name="title" required value={formData.title} onChange={handleTextChange} placeholder="e.g. 5-Day Premium Kudu Safari" className="h-14 bg-white/80 dark:bg-black/50 border-kalahari/50 dark:border-kalahari/30 focus-visible:ring-olive dark:focus-visible:ring-kalahari text-olive dark:text-off-white dark:placeholder:text-off-white/40 font-bold text-xl transition-colors" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Stepper: Price */}
              <div>
                <label className="block text-sm font-bold text-olive dark:text-off-white mb-2 flex items-center gap-2 transition-colors"><DollarSign className="h-4 w-4 text-kalahari" /> Total Price (USD)</label>
                <div className="flex items-center h-14 bg-white/80 dark:bg-black/50 border-2 border-kalahari/50 dark:border-kalahari/30 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-olive dark:focus-within:ring-kalahari focus-within:border-transparent transition-colors">
                  <button type="button" onClick={() => setFormData(p => ({ ...p, price: Math.max(0, p.price - 500) }))} className="w-14 shrink-0 h-full bg-off-white/80 dark:bg-black/60 hover:bg-kalahari/20 dark:hover:bg-kalahari/20 flex items-center justify-center text-olive dark:text-off-white border-r-2 border-kalahari/50 dark:border-kalahari/30 transition-colors">
                    <Minus className="h-5 w-5" />
                  </button>
                  <input 
                    type="number" 
                    name="price" 
                    required 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} 
                    className="flex-1 w-full h-full text-center bg-transparent font-black text-xl text-olive dark:text-off-white outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0" 
                  />
                  <button type="button" onClick={() => setFormData(p => ({ ...p, price: p.price + 500 }))} className="w-14 shrink-0 h-full bg-off-white/80 dark:bg-black/60 hover:bg-kalahari/20 dark:hover:bg-kalahari/20 flex items-center justify-center text-olive dark:text-off-white border-l-2 border-kalahari/50 dark:border-kalahari/30 transition-colors">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Stepper: Duration */}
              <div>
                <label className="block text-sm font-bold text-olive dark:text-off-white mb-2 flex items-center gap-2 transition-colors"><Calendar className="h-4 w-4 text-kalahari" /> Duration (Days)</label>
                <div className="flex items-center h-14 bg-white/80 dark:bg-black/50 border-2 border-kalahari/50 dark:border-kalahari/30 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-olive dark:focus-within:ring-kalahari focus-within:border-transparent transition-colors">
                  <button type="button" onClick={() => setFormData(p => ({ ...p, duration: Math.max(1, p.duration - 1) }))} className="w-14 shrink-0 h-full bg-off-white/80 dark:bg-black/60 hover:bg-kalahari/20 dark:hover:bg-kalahari/20 flex items-center justify-center text-olive dark:text-off-white border-r-2 border-kalahari/50 dark:border-kalahari/30 transition-colors">
                    <Minus className="h-5 w-5" />
                  </button>
                  <input 
                    type="number" 
                    name="duration" 
                    required 
                    value={formData.duration} 
                    onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})} 
                    className="flex-1 w-full h-full text-center bg-transparent font-black text-xl text-olive dark:text-off-white outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0" 
                  />
                  <button type="button" onClick={() => setFormData(p => ({ ...p, duration: p.duration + 1 }))} className="w-14 shrink-0 h-full bg-off-white/80 dark:bg-black/60 hover:bg-kalahari/20 dark:hover:bg-kalahari/20 flex items-center justify-center text-olive dark:text-off-white border-l-2 border-kalahari/50 dark:border-kalahari/30 transition-colors">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Dropdown: Location */}
              <div>
                <label className="block text-sm font-bold text-olive dark:text-off-white mb-2 flex items-center gap-2 transition-colors"><MapPin className="h-4 w-4 text-kalahari" /> Region / Province</label>
                <select name="location" required value={formData.location} onChange={handleTextChange} className="w-full h-14 bg-white/80 dark:bg-black/50 border-2 border-kalahari/50 dark:border-kalahari/30 rounded-md px-4 font-bold text-olive dark:text-off-white outline-none focus:ring-2 focus:ring-olive dark:focus:ring-kalahari focus:border-transparent cursor-pointer transition-colors [&>option]:bg-white [&>option]:dark:bg-olive">
                  <option value="" disabled>Select Province...</option>
                  {PROVINCES.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                </select>
              </div>
            </div>

            {/* Multi-Select Tags: Primary Species */}
            <div className="bg-off-white/80 dark:bg-black/40 backdrop-blur-sm p-6 rounded-xl border border-kalahari/20 dark:border-kalahari/30 transition-colors">
              <label className="block text-sm font-bold text-olive dark:text-off-white mb-3 flex items-center gap-2 transition-colors"><Target className="h-5 w-5 text-kalahari" /> Included Package Animals (Primary Target)</label>
              <select 
                className="w-full md:w-1/2 h-12 bg-white/80 dark:bg-black/50 border-2 border-kalahari/50 dark:border-kalahari/30 rounded-md px-4 font-bold text-olive dark:text-off-white outline-none focus:ring-2 focus:ring-olive dark:focus:ring-kalahari cursor-pointer mb-4 transition-colors [&>option]:bg-white [&>option]:dark:bg-olive"
                onChange={(e) => {
                  if (e.target.value && !primarySpecies.includes(e.target.value)) {
                    setPrimarySpecies([...primarySpecies, e.target.value]);
                  }
                  e.target.value = ""; 
                }}
              >
                <option value="">+ Select animal to add to package...</option>
                {AFRICAN_ANIMALS.map(animal => <option key={animal} value={animal}>{animal}</option>)}
              </select>
              
              <div className="flex flex-wrap gap-2">
                {primarySpecies.length === 0 && <span className="text-sm text-olive/50 dark:text-off-white/50 font-medium italic transition-colors">No animals added yet.</span>}
                {primarySpecies.map(animal => (
                  <div key={animal} className="bg-kalahari text-white font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm animate-in zoom-in duration-200">
                    {animal}
                    <button type="button" onClick={() => setPrimarySpecies(primarySpecies.filter(a => a !== animal))} className="hover:text-black transition-colors"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-olive dark:text-off-white mb-2 transition-colors">Full Description & Itinerary</label>
              <Textarea name="description" required value={formData.description} onChange={handleTextChange} rows={6} placeholder="Describe the daily itinerary, accommodation style, and what to expect..." className="bg-white/80 dark:bg-black/50 border-kalahari/50 dark:border-kalahari/30 focus-visible:ring-olive dark:focus-visible:ring-kalahari text-olive dark:text-off-white dark:placeholder:text-off-white/40 font-medium text-base resize-y transition-colors" />
            </div>
          </div>

          {/* --- INCLUSIONS & EXTRAS (GRID) --- */}
          <div className="space-y-8 pt-8 border-t-2 border-kalahari/20 dark:border-kalahari/30">
            <h2 className="text-2xl font-black font-headline text-olive dark:text-off-white border-b-2 border-kalahari/20 dark:border-kalahari/30 pb-2 transition-colors">Inclusions & Exclusions</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              
              {/* Included Section */}
              <div className="bg-green-50/80 dark:bg-green-950/40 backdrop-blur-sm p-6 rounded-xl border-2 border-green-200 dark:border-green-900/50 transition-colors">
                <label className="block text-lg font-black text-green-800 dark:text-green-400 mb-4 flex items-center gap-2 transition-colors"><CheckCircle2 className="h-5 w-5" /> What is Included?</label>
                <div className="space-y-3 mb-6">
                  {COMMON_INCLUSIONS.map(item => (
                    <label key={item} className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" checked={includedItems.includes(item)} onChange={() => toggleArrayItem(item, includedItems, setIncludedItems)} className="mt-1 w-5 h-5 accent-green-600 dark:accent-green-500 cursor-pointer" />
                      <span className="font-medium text-green-900 dark:text-green-100 group-hover:text-green-700 dark:group-hover:text-white transition-colors">{item}</span>
                    </label>
                  ))}
                </div>
                <Input value={otherInclusions} onChange={(e) => setOtherInclusions(e.target.value)} placeholder="Other specific inclusions..." className="bg-white/80 dark:bg-black/50 border-green-300 dark:border-green-800 focus-visible:ring-green-600 dark:focus-visible:ring-green-500 text-green-900 dark:text-green-100 dark:placeholder:text-green-100/40 transition-colors" />
              </div>

              {/* Excluded Section */}
              <div className="bg-red-50/80 dark:bg-red-950/40 backdrop-blur-sm p-6 rounded-xl border-2 border-red-200 dark:border-red-900/50 transition-colors">
                <label className="block text-lg font-black text-red-800 dark:text-red-400 mb-4 flex items-center gap-2 transition-colors"><XCircle className="h-5 w-5" /> What is Excluded?</label>
                <div className="space-y-3 mb-6">
                  {COMMON_EXCLUSIONS.map(item => (
                    <label key={item} className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" checked={excludedItems.includes(item)} onChange={() => toggleArrayItem(item, excludedItems, setExcludedItems)} className="mt-1 w-5 h-5 accent-red-600 dark:accent-red-500 cursor-pointer" />
                      <span className="font-medium text-red-900 dark:text-red-100 group-hover:text-red-700 dark:group-hover:text-white transition-colors">{item}</span>
                    </label>
                  ))}
                </div>
                <Input value={otherExclusions} onChange={(e) => setOtherExclusions(e.target.value)} placeholder="Other specific exclusions..." className="bg-white/80 dark:bg-black/50 border-red-300 dark:border-red-800 focus-visible:ring-red-600 dark:focus-visible:ring-red-500 text-red-900 dark:text-red-100 dark:placeholder:text-red-100/40 transition-colors" />
              </div>
            </div>

            {/* Additional Species Pricing Matrix */}
            <div className="bg-white/80 dark:bg-black/40 backdrop-blur-sm p-6 rounded-xl border-2 border-kalahari/30 dark:border-kalahari/30 transition-colors">
              <label className="block text-lg font-black text-olive dark:text-off-white mb-2 flex items-center gap-2 transition-colors"><PlusCircle className="h-5 w-5 text-kalahari" /> Additional Species Available on Quota</label>
              <p className="text-sm text-olive/60 dark:text-off-white/60 font-medium mb-6 transition-colors">Select animals hunters can add to their package. Enter a Trophy Fee to save time answering emails, or leave it blank to display "Price on Request".</p>
              
              <select 
                className="w-full md:w-1/2 h-12 bg-white/80 dark:bg-black/50 border-2 border-kalahari/50 dark:border-kalahari/30 rounded-md px-4 font-bold text-olive dark:text-off-white outline-none focus:ring-2 focus:ring-olive dark:focus:ring-kalahari cursor-pointer mb-6 transition-colors [&>option]:bg-white [&>option]:dark:bg-olive"
                onChange={(e) => {
                  handleAddAdditionalSpecies(e.target.value);
                  e.target.value = "";
                }}
              >
                <option value="">+ Add available species...</option>
                {AFRICAN_ANIMALS.map(animal => <option key={animal} value={animal}>{animal}</option>)}
              </select>

              <div className="space-y-3">
                {additionalSpecies.length === 0 && <div className="text-center py-6 border-2 border-dashed border-kalahari/20 dark:border-kalahari/30 rounded-lg text-olive/50 dark:text-off-white/50 font-bold transition-colors">No additional species added.</div>}
                {additionalSpecies.map((species) => (
                  <div key={species.name} className="flex items-center gap-4 bg-off-white/80 dark:bg-black/50 p-3 rounded-lg border border-kalahari/20 dark:border-kalahari/30 animate-in fade-in duration-200 transition-colors">
                    <div className="flex-1 font-bold text-olive dark:text-off-white">{species.name}</div>
                    <div className="relative w-32 md:w-48">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-olive/50 dark:text-off-white/50 font-bold">$</span>
                      <Input 
                        type="number" min="0" 
                        placeholder="Request" 
                        value={species.price} 
                        onChange={(e) => updateAdditionalSpeciesPrice(species.name, e.target.value)} 
                        className="pl-8 bg-white/80 dark:bg-black/50 border-kalahari/30 dark:border-kalahari/40 focus-visible:ring-olive dark:focus-visible:ring-kalahari text-olive dark:text-off-white dark:placeholder:text-off-white/40 font-bold transition-colors" 
                      />
                    </div>
                    <button type="button" onClick={() => removeAdditionalSpecies(species.name)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t-2 border-kalahari/20 dark:border-kalahari/30 flex justify-end transition-colors">
            <Button type="submit" disabled={saving} className="bg-olive dark:bg-kalahari hover:bg-olive/90 dark:hover:bg-kalahari/90 text-kalahari dark:text-olive dark:text-off-white font-black text-lg h-14 px-12 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-2 w-full md:w-auto rounded-full">
              {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
              {saving ? "Publishing to Marketplace..." : "Publish Package"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}