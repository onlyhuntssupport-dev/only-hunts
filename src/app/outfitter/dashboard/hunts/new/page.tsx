"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase/client";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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

  // Checkbox Toggles
  const toggleArrayItem = (item: string, array: string[], setArray: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  // Additional Species Toggles
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
      // 1. Compile the structured data into beautiful bulleted strings for the public view
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

      // 2. Upload Cover Image
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `hunts/${auth.currentUser.uid}_${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, imageFile);
      const coverImageUrl = await getDownloadURL(storageRef);

      // 3. Save to Firebase (With Database Architecture Upgrades)
      await addDoc(collection(db, "hunts"), {
        outfitterId: auth.currentUser.uid,
        outfitterName: outfitterDetails.name,
        outfitterLogo: outfitterDetails.logo,
        title: formData.title,
        price: Number(formData.price),
        duration: Number(formData.duration),
        location: formData.location,
        
        // Formatted strings for quick UI rendering
        primarySpecies: compiledPrimary,      
        includedItems: compiledIncluded,      
        excludedItems: compiledExcluded,      
        additionalSpecies: compiledAdditional, 
        description: formData.description,
        
        // Raw Arrays for robust Search/Filtering later
        primarySpeciesArray: primarySpecies,
        additionalSpeciesArray: additionalSpecies,
        
        // CRITICAL: Analytics and Special Offer flags
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
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      <div className="flex items-center gap-4 border-b-2 border-kalahari/30 pb-6">
        <Link href="/outfitter/dashboard/hunts">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-kalahari/50 text-olive dark:text-off-white hover:bg-kalahari/20">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-headline font-bold text-olive dark:text-off-white tracking-tight">Create Package</h1>
          <p className="text-olive dark:text-off-white/70 font-medium">Build a structured, premium hunting experience.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 font-bold shadow-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border-2 border-kalahari/30 rounded-xl p-6 md:p-10 shadow-sm space-y-12">
        
        {/* Cover Image */}
        <div>
          <h2 className="text-xl font-bold font-headline text-olive dark:text-off-white mb-4">Cover Image</h2>
          <div className="relative w-full h-64 md:h-[400px] bg-kalahari/10 border-2 border-dashed border-kalahari/40 rounded-xl flex flex-col items-center justify-center overflow-hidden group cursor-pointer hover:bg-kalahari/20 transition-colors">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-olive dark:text-off-white/60 group-hover:text-olive dark:text-off-white/80 transition-colors">
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
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-kalahari/20 pb-2 gap-4">
            <h2 className="text-2xl font-black font-headline text-olive dark:text-off-white">Package Details</h2>
          </div>

          {/* Special Offer Toggle */}
          <div 
            onClick={() => setIsSpecialOffer(!isSpecialOffer)}
            className={`border-2 rounded-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer transition-all ${
              isSpecialOffer ? 'bg-orange-50 border-orange-400 shadow-md' : 'bg-off-white border-kalahari/30 hover:border-kalahari/60'
            }`}
          >
            <div className="pr-4 mb-4 md:mb-0">
              <h3 className={`text-lg font-black flex items-center gap-2 ${isSpecialOffer ? 'text-orange-700' : 'text-olive dark:text-off-white'}`}>
                <Flame className={`h-5 w-5 ${isSpecialOffer ? 'text-orange-500' : 'text-kalahari'}`} /> 
                Last-Minute Cancellation or Special Offer?
              </h3>
              <p className={`text-sm font-medium mt-1 ${isSpecialOffer ? 'text-orange-800/80' : 'text-olive dark:text-off-white/60'}`}>
                Toggle this ON to feature this package on the public Deals page. This is great for filling empty dates fast.
              </p>
            </div>
            
            {/* Custom Styled Switch */}
            <div className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out ${isSpecialOffer ? 'bg-orange-500' : 'bg-kalahari/40'}`}>
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition duration-300 ease-in-out ${isSpecialOffer ? 'translate-x-7' : 'translate-x-1'}`} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-olive dark:text-off-white mb-2">Package Title</label>
            <Input name="title" required value={formData.title} onChange={handleTextChange} placeholder="e.g. 5-Day Premium Kudu Safari" className="h-14 border-kalahari/50 focus-visible:ring-olive font-bold text-xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Stepper: Price */}
            <div>
              <label className="block text-sm font-bold text-olive dark:text-off-white mb-2 flex items-center gap-2"><DollarSign className="h-4 w-4 text-kalahari" /> Total Price (USD)</label>
              <div className="flex items-center h-14 border-2 border-kalahari/50 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-olive focus-within:border-transparent bg-white">
                <button type="button" onClick={() => setFormData(p => ({ ...p, price: Math.max(0, p.price - 500) }))} className="w-14 shrink-0 h-full bg-off-white hover:bg-kalahari/20 flex items-center justify-center text-olive dark:text-off-white border-r-2 border-kalahari/50 transition-colors">
                  <Minus className="h-5 w-5" />
                </button>
                <input 
                  type="number" 
                  name="price" 
                  required 
                  value={formData.price} 
                  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} 
                  className="flex-1 w-full h-full text-center font-black text-xl text-olive dark:text-off-white outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0" 
                />
                <button type="button" onClick={() => setFormData(p => ({ ...p, price: p.price + 500 }))} className="w-14 shrink-0 h-full bg-off-white hover:bg-kalahari/20 flex items-center justify-center text-olive dark:text-off-white border-l-2 border-kalahari/50 transition-colors">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Stepper: Duration */}
            <div>
              <label className="block text-sm font-bold text-olive dark:text-off-white mb-2 flex items-center gap-2"><Calendar className="h-4 w-4 text-kalahari" /> Duration (Days)</label>
              <div className="flex items-center h-14 border-2 border-kalahari/50 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-olive focus-within:border-transparent bg-white">
                <button type="button" onClick={() => setFormData(p => ({ ...p, duration: Math.max(1, p.duration - 1) }))} className="w-14 shrink-0 h-full bg-off-white hover:bg-kalahari/20 flex items-center justify-center text-olive dark:text-off-white border-r-2 border-kalahari/50 transition-colors">
                  <Minus className="h-5 w-5" />
                </button>
                <input 
                  type="number" 
                  name="duration" 
                  required 
                  value={formData.duration} 
                  onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})} 
                  className="flex-1 w-full h-full text-center font-black text-xl text-olive dark:text-off-white outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0" 
                />
                <button type="button" onClick={() => setFormData(p => ({ ...p, duration: p.duration + 1 }))} className="w-14 shrink-0 h-full bg-off-white hover:bg-kalahari/20 flex items-center justify-center text-olive dark:text-off-white border-l-2 border-kalahari/50 transition-colors">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Dropdown: Location */}
            <div>
              <label className="block text-sm font-bold text-olive dark:text-off-white mb-2 flex items-center gap-2"><MapPin className="h-4 w-4 text-kalahari" /> Region / Province</label>
              <select name="location" required value={formData.location} onChange={handleTextChange} className="w-full h-14 border-2 border-kalahari/50 rounded-md px-4 font-bold text-olive dark:text-off-white outline-none focus:ring-2 focus:ring-olive focus:border-transparent cursor-pointer bg-white">
                <option value="" disabled>Select Province...</option>
                {PROVINCES.map(prov => <option key={prov} value={prov}>{prov}</option>)}
              </select>
            </div>
          </div>

          {/* Multi-Select Tags: Primary Species */}
          <div className="bg-off-white p-6 rounded-xl border border-kalahari/20">
            <label className="block text-sm font-bold text-olive dark:text-off-white mb-3 flex items-center gap-2"><Target className="h-5 w-5 text-kalahari" /> Included Package Animals (Primary Target)</label>
            <select 
              className="w-full md:w-1/2 h-12 border-2 border-kalahari/50 rounded-md px-4 font-bold text-olive dark:text-off-white outline-none focus:ring-2 focus:ring-olive cursor-pointer bg-white mb-4"
              onChange={(e) => {
                if (e.target.value && !primarySpecies.includes(e.target.value)) {
                  setPrimarySpecies([...primarySpecies, e.target.value]);
                }
                e.target.value = ""; // reset dropdown
              }}
            >
              <option value="">+ Select animal to add to package...</option>
              {AFRICAN_ANIMALS.map(animal => <option key={animal} value={animal}>{animal}</option>)}
            </select>
            
            <div className="flex flex-wrap gap-2">
              {primarySpecies.length === 0 && <span className="text-sm text-olive dark:text-off-white/50 font-medium italic">No animals added yet.</span>}
              {primarySpecies.map(animal => (
                <div key={animal} className="bg-kalahari text-white font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm animate-in zoom-in duration-200">
                  {animal}
                  <button type="button" onClick={() => setPrimarySpecies(primarySpecies.filter(a => a !== animal))} className="hover:text-black transition-colors"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-olive dark:text-off-white mb-2">Full Description & Itinerary</label>
            <Textarea name="description" required value={formData.description} onChange={handleTextChange} rows={6} placeholder="Describe the daily itinerary, accommodation style, and what to expect..." className="border-kalahari/50 focus-visible:ring-olive font-medium text-base resize-y" />
          </div>
        </div>

        {/* --- INCLUSIONS & EXTRAS (GRID) --- */}
        <div className="space-y-8 pt-8 border-t-2 border-kalahari/20">
          <h2 className="text-2xl font-black font-headline text-olive dark:text-off-white border-b-2 border-kalahari/20 pb-2">Inclusions & Exclusions</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Included Section */}
            <div className="bg-green-50/50 p-6 rounded-xl border-2 border-green-200">
              <label className="block text-lg font-black text-green-800 mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> What is Included?</label>
              <div className="space-y-3 mb-6">
                {COMMON_INCLUSIONS.map(item => (
                  <label key={item} className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" checked={includedItems.includes(item)} onChange={() => toggleArrayItem(item, includedItems, setIncludedItems)} className="mt-1 w-5 h-5 accent-green-600 cursor-pointer" />
                    <span className="font-medium text-green-900 group-hover:text-green-700 transition-colors">{item}</span>
                  </label>
                ))}
              </div>
              <Input value={otherInclusions} onChange={(e) => setOtherInclusions(e.target.value)} placeholder="Other specific inclusions..." className="border-green-300 focus-visible:ring-green-600 bg-white" />
            </div>

            {/* Excluded Section */}
            <div className="bg-red-50/50 p-6 rounded-xl border-2 border-red-200">
              <label className="block text-lg font-black text-red-800 mb-4 flex items-center gap-2"><XCircle className="h-5 w-5" /> What is Excluded?</label>
              <div className="space-y-3 mb-6">
                {COMMON_EXCLUSIONS.map(item => (
                  <label key={item} className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" checked={excludedItems.includes(item)} onChange={() => toggleArrayItem(item, excludedItems, setExcludedItems)} className="mt-1 w-5 h-5 accent-red-600 cursor-pointer" />
                    <span className="font-medium text-red-900 group-hover:text-red-700 transition-colors">{item}</span>
                  </label>
                ))}
              </div>
              <Input value={otherExclusions} onChange={(e) => setOtherExclusions(e.target.value)} placeholder="Other specific exclusions..." className="border-red-300 focus-visible:ring-red-600 bg-white" />
            </div>
          </div>

          {/* Additional Species Pricing Matrix */}
          <div className="bg-white p-6 rounded-xl border-2 border-kalahari/30">
            <label className="block text-lg font-black text-olive dark:text-off-white mb-2 flex items-center gap-2"><PlusCircle className="h-5 w-5 text-kalahari" /> Additional Species Available on Quota</label>
            <p className="text-sm text-olive dark:text-off-white/60 font-medium mb-6">Select animals hunters can add to their package. Enter a Trophy Fee to save time answering emails, or leave it blank to display "Price on Request".</p>
            
            <select 
              className="w-full md:w-1/2 h-12 border-2 border-kalahari/50 rounded-md px-4 font-bold text-olive dark:text-off-white outline-none focus:ring-2 focus:ring-olive cursor-pointer bg-white mb-6"
              onChange={(e) => {
                handleAddAdditionalSpecies(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="">+ Add available species...</option>
              {AFRICAN_ANIMALS.map(animal => <option key={animal} value={animal}>{animal}</option>)}
            </select>

            <div className="space-y-3">
              {additionalSpecies.length === 0 && <div className="text-center py-6 border-2 border-dashed border-kalahari/20 rounded-lg text-olive dark:text-off-white/50 font-bold">No additional species added.</div>}
              {additionalSpecies.map((species) => (
                <div key={species.name} className="flex items-center gap-4 bg-off-white p-3 rounded-lg border border-kalahari/20 animate-in fade-in duration-200">
                  <div className="flex-1 font-bold text-olive dark:text-off-white">{species.name}</div>
                  <div className="relative w-32 md:w-48">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-olive dark:text-off-white/50 font-bold">$</span>
                    <Input 
                      type="number" min="0" 
                      placeholder="Request" 
                      value={species.price} 
                      onChange={(e) => updateAdditionalSpeciesPrice(species.name, e.target.value)} 
                      className="pl-8 border-kalahari/30 focus-visible:ring-olive font-bold" 
                    />
                  </div>
                  <button type="button" onClick={() => removeAdditionalSpecies(species.name)} className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t-2 border-kalahari/20 flex justify-end">
          <Button type="submit" disabled={saving} className="bg-olive hover:bg-olive/90 text-kalahari font-black text-lg h-14 px-12 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-2 w-full md:w-auto rounded-full">
            {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
            {saving ? "Publishing to Marketplace..." : "Publish Package"}
          </Button>
        </div>
      </form>
    </div>
  );
}