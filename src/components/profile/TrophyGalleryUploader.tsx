"use client";

import { UploadCloud } from "lucide-react";

interface TrophyGalleryUploaderProps {
  existingGallery: string[];
  galleryFiles: File[];
  onGallerySelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function TrophyGalleryUploader({ existingGallery, galleryFiles, onGallerySelect }: TrophyGalleryUploaderProps) {
  return (
    <div className="pt-6 border-t border-kalahari/20">
      <div className="flex justify-between items-end mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-kalahari text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Step 3</span>
          <label className="block text-sm font-bold text-kalahari uppercase tracking-widest">Trophy Gallery</label>
        </div>
        <span className="text-xs font-bold text-kalahari/80">
          {existingGallery.length + galleryFiles.length} / 3 Required
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {existingGallery.map((url, i) => (
          <div key={i} className="aspect-square rounded-xl overflow-hidden border-2 border-kalahari/30 relative">
            <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
          </div>
        ))}
        <div className="aspect-square rounded-xl border-2 border-dashed border-kalahari/40 bg-black/20 hover:bg-black/40 transition-colors flex flex-col items-center justify-center cursor-pointer relative group">
          <UploadCloud className="h-8 w-8 text-kalahari/60 group-hover:text-kalahari mb-2 transition-colors" />
          <span className="text-xs font-bold text-kalahari/80">Add Photos</span>
          <input type="file" multiple accept="image/*" onChange={onGallerySelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        </div>
      </div>
    </div>
  );
}