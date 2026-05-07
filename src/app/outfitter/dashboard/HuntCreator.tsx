"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createHuntListing } from "@/app/actions/hunts";
import { uploadWithCompression } from "@/lib/firebase/storageHelper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UploadCloud, X, Globe, MapPin } from "lucide-react";

interface HuntCreatorProps {
  outfitterId: string;
  outfitterName: string;
}

const SUPPORTED_COUNTRIES = [
  "South Africa",
  "Namibia",
  "Zimbabwe",
  "Botswana",
  "Mozambique"
];

export default function HuntCreator({ outfitterId, outfitterName }: HuntCreatorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    species: "",
    price: "",
    duration: "",
    country: "South Africa", // Default to SA
    region: "", // Specific province/concession
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      // 1. Compress and Upload all images to Firebase Storage
      const uploadedUrls = await Promise.all(
        images.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `hunts/${outfitterId}_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
          return await uploadWithCompression(file, fileName);
        })
      );

      // 2. Format data for the database with the new Regional split
      const huntData = {
        title: formData.title,
        outfitterName: outfitterName,
        species: formData.species.split(",").map(s => s.trim()), 
        price: Number(formData.price),
        duration: formData.duration,
        country: formData.country, // STRICT ENUM FOR SEARCH FILTERS
        region: formData.region,
        location: `${formData.region}, ${formData.country}`, // BACKWARD COMPATIBILITY STRING
        description: formData.description,
        images: uploadedUrls,
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
    <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-stone-900 p-8 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-md text-sm font-bold">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-stone-900 dark:text-white border-b border-stone-200 dark:border-stone-800 pb-2">Package Details</h2>
        
        <div>
          <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Listing Title</label>
          <Input name="title" required value={formData.title} onChange={handleChange} placeholder="e.g. 7-Day Premium Elephant Safari" className="h-12 dark:bg-stone-950 dark:border-stone-800" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Primary Species (Comma separated)</label>
            <Input name="species" required value={formData.species} onChange={handleChange} placeholder="e.g. Elephant, Leopard, Buffalo" className="h-12 dark:bg-stone-950 dark:border-stone-800" />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5"><Globe className="h-4 w-4 text-kalahari"/> Country</label>
            <select
              name="country"
              required
              value={formData.country}
              onChange={handleChange}
              className="w-full h-12 px-3 rounded-md border border-stone-200 dark:border-stone-800 bg-transparent dark:bg-stone-950 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-800"
            >
              {SUPPORTED_COUNTRIES.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5"><MapPin className="h-4 w-4 text-kalahari"/> Province / Concession</label>
            <Input name="region" required value={formData.region} onChange={handleChange} placeholder="e.g. Zambezi Valley" className="h-12 dark:bg-stone-950 dark:border-stone-800" />
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Price (USD)</label>
            <Input type="number" name="price" required min="0" value={formData.price} onChange={handleChange} placeholder="e.g. 15000" className="h-12 dark:bg-stone-950 dark:border-stone-800" />
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Duration</label>
            <Input name="duration" required value={formData.duration} onChange={handleChange} placeholder="e.g. 10 Days / 9 Nights" className="h-12 dark:bg-stone-950 dark:border-stone-800" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Description</label>
          <textarea 
            name="description" 
            required 
            rows={5}
            value={formData.description} 
            onChange={handleChange} 
            placeholder="Describe the accommodations, terrain, what's included, etc."
            className="w-full rounded-md border border-stone-200 dark:border-stone-800 bg-transparent dark:bg-stone-950 px-3 py-2 text-sm shadow-sm placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-800" 
          />
        </div>
      </div>

      {/* Photos */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-stone-900 dark:text-white border-b border-stone-200 dark:border-stone-800 pb-2">Photos</h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">High-quality photos significantly increase booking rates. The first image will be your cover photo.</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {imagePreviews.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden group">
              <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-900/50 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition-colors">
            <UploadCloud className="h-6 w-6 text-stone-400 mb-2" />
            <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Upload Photos</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        </div>
      </div>

      <div className="pt-6 border-t border-stone-200 dark:border-stone-800 flex justify-end gap-4">
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={loading} className="dark:text-stone-300">Cancel</Button>
        <Button type="submit" disabled={loading} className="bg-amber-800 hover:bg-amber-900 text-white h-12 px-8 text-lg gap-2">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit for Approval"}
        </Button>
      </div>
    </form>
  );
}