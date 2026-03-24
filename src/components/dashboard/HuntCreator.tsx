"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createHuntListing } from "@/app/actions/hunts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UploadCloud, X, DollarSign } from "lucide-react";

interface HuntCreatorProps {
  outfitterId: string;
  outfitterName: string;
}

// --- CONSTANTS FOR DROPDOWNS ---
const SA_PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", 
  "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape"
];

const SA_PLAINS_GAME = [
  "Blesbok", "Blue Wildebeest", "Black Wildebeest", "Buffalo", "Bushbuck",
  "Eland", "Gemsbok (Oryx)", "Giraffe", "Hartebeest (Red)", "Impala", 
  "Kudu", "Nyala", "Ostrich", "Roan Antelope", "Sable Antelope", 
  "Springbok", "Steenbok", "Tsesebe", "Waterbuck", "Warthog", "Zebra"
];

const DURATIONS = Array.from({ length: 20 }, (_, i) => i + 1); // [1, 2, ..., 20]

export default function HuntCreator({ outfitterId, outfitterName }: HuntCreatorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Updated state with default values for the dropdowns and slider
  const [formData, setFormData] = useState({
    title: "",
    primarySpecies: SA_PLAINS_GAME[10], // Default to Kudu
    price: 3500, // Default slider value
    duration: 7, // Default to 7 days
    location: SA_PROVINCES[4], // Default to Limpopo
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: name === "price" || name === "duration" ? Number(value) : value 
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages((prev) => [...prev, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setError("Please upload at least one image for your listing.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Upload all images to Firebase Storage
      const uploadedUrls = await Promise.all(
        images.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `hunts/${outfitterId}_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
          const storageRef = ref(storage, fileName);
          await uploadBytes(storageRef, file);
          return await getDownloadURL(storageRef);
        })
      );

      // 2. Format data for the database
      const huntData = {
        title: formData.title,
        outfitterName: outfitterName,
        primarySpecies: formData.primarySpecies,
        species: [formData.primarySpecies], // Start the array with the primary target
        price: Number(formData.price),
        duration: Number(formData.duration),
        location: formData.location,
        province: formData.location, // Save to both for legacy compatibility
        description: formData.description,
        images: uploadedUrls,
        coverImage: uploadedUrls[0], // Set the first image as the cover
      };

      // 3. Save to Firestore via Server Action
      const result = await createHuntListing(huntData, outfitterId);

      if (result.success) {
        router.push("/outfitter/dashboard");
      } else {
        setError(result.error || "Failed to create listing. Ensure your account is ACTIVE.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred during upload.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-8 rounded-xl border border-kalahari/30 shadow-sm max-w-4xl mx-auto">
      {error && (
        <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-md text-sm font-bold">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold font-headline text-olive dark:text-off-white border-b-2 border-kalahari/30 pb-3">Package Details</h2>
        
        <div>
          <label className="block text-sm font-bold text-olive dark:text-off-white mb-1.5">Listing Title</label>
          <Input 
            name="title" 
            required 
            value={formData.title} 
            onChange={handleChange} 
            placeholder="e.g. 7-Day Premium Kudu & Gemsbok Safari" 
            className="h-12 border-kalahari/50 focus-visible:ring-olive text-lg" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Custom Select: Target Species */}
          <div>
            <label className="block text-sm font-bold text-olive dark:text-off-white mb-1.5">Primary Target Species</label>
            <select
              name="primarySpecies"
              required
              value={formData.primarySpecies}
              onChange={handleChange}
              className="flex h-12 w-full items-center justify-between rounded-md border border-kalahari/50 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-olive focus:ring-offset-2 text-olive dark:text-off-white font-medium"
            >
              {SA_PLAINS_GAME.map((animal) => (
                <option key={animal} value={animal}>{animal}</option>
              ))}
            </select>
          </div>

          {/* Custom Select: Location */}
          <div>
            <label className="block text-sm font-bold text-olive dark:text-off-white mb-1.5">South African Province</label>
            <select
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              className="flex h-12 w-full items-center justify-between rounded-md border border-kalahari/50 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-olive focus:ring-offset-2 text-olive dark:text-off-white font-medium"
            >
              {SA_PROVINCES.map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          {/* Custom Select: Duration */}
          <div>
            <label className="block text-sm font-bold text-olive dark:text-off-white mb-1.5">Duration (Days)</label>
            <select
              name="duration"
              required
              value={formData.duration}
              onChange={handleChange}
              className="flex h-12 w-full items-center justify-between rounded-md border border-kalahari/50 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-olive focus:ring-offset-2 text-olive dark:text-off-white font-medium"
            >
              {DURATIONS.map((day) => (
                <option key={day} value={day}>{day === 1 ? '1 Day' : `${day} Days`}</option>
              ))}
            </select>
          </div>

          {/* Custom Slider: Price in $500 increments */}
          <div className="bg-kalahari/10 p-4 rounded-lg border border-kalahari/30">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-bold text-olive dark:text-off-white">Total Price (USD)</label>
              <div className="bg-olive text-kalahari font-bold px-3 py-1 rounded-md flex items-center shadow-sm">
                <DollarSign className="h-4 w-4 mr-0.5" />
                {formData.price.toLocaleString()}
              </div>
            </div>
            <input 
              type="range" 
              name="price" 
              min="500" 
              max="50000" 
              step="500" 
              value={formData.price} 
              onChange={handleChange} 
              className="w-full h-2 bg-kalahari/40 rounded-lg appearance-none cursor-pointer accent-olive"
            />
            <div className="flex justify-between text-xs text-olive dark:text-off-white/60 mt-2 font-bold">
              <span>$500</span>
              <span>$50,000</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-olive dark:text-off-white mb-1.5">Package Description</label>
          <Textarea 
            name="description" 
            required 
            rows={6}
            value={formData.description} 
            onChange={handleChange} 
            placeholder="Describe the accommodations, terrain, what's included (meals, trackers, transport), and what's excluded (flights, taxidermy)..."
            className="text-base border-kalahari/50 focus-visible:ring-olive"
          />
        </div>
      </div>

      {/* Photos Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold font-headline text-olive dark:text-off-white border-b-2 border-kalahari/30 pb-3">Package Photos</h2>
        <p className="text-sm text-olive dark:text-off-white/70 mb-4 font-medium">High-quality photos significantly increase booking rates. The first image will be your cover photo.</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {imagePreviews.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg border-2 border-kalahari/30 overflow-hidden group shadow-sm">
              <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-kalahari text-olive dark:text-off-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md uppercase tracking-wider">
                  Cover
                </div>
              )}
              <button 
                type="button" 
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-kalahari/50 rounded-lg bg-kalahari/5 hover:bg-kalahari/10 hover:border-kalahari cursor-pointer transition-colors">
            <UploadCloud className="h-8 w-8 text-kalahari mb-2" />
            <span className="text-sm font-bold text-olive dark:text-off-white/70">Upload Photos</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        </div>
      </div>

      <div className="pt-8 border-t-2 border-kalahari/30 flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="h-12 px-6 font-bold border-kalahari text-olive dark:text-off-white hover:bg-kalahari/10">Cancel</Button>
        <Button type="submit" disabled={loading} className="bg-olive hover:bg-olive/90 text-kalahari h-12 px-8 text-lg font-black shadow-md transition-all">
          {loading ? (
            <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Uploading...</>
          ) : (
            "Submit for Approval"
          )}
        </Button>
      </div>
    </form>
  );
}