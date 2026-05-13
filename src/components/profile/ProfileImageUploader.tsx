"use client";

import { Camera, User } from "lucide-react";

interface ProfileImageUploaderProps {
  imagePreview: string | null;
  isOutfitter: boolean;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProfileImageUploader({ imagePreview, isOutfitter, onImageSelect }: ProfileImageUploaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 border-b border-kalahari/20 pb-10">
      <div className="relative group cursor-pointer shrink-0">
        <div className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-kalahari/40 overflow-hidden bg-black/50 flex items-center justify-center transition-all group-hover:border-kalahari shadow-xl">
          {imagePreview ? (
            <img src={imagePreview} alt="Profile Preview" className="h-full w-full object-cover" />
          ) : (
            <User className="h-16 w-16 text-off-white/30" />
          )}
        </div>
        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border-4 border-transparent">
          <Camera className="h-8 w-8 text-white drop-shadow-md" />
        </div>
        <input type="file" accept="image/*" onChange={onImageSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      </div>
      
      <div className="text-center sm:text-left pt-2 flex-1">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
          {isOutfitter && <span className="bg-kalahari text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Step 1</span>}
          <h3 className="text-xl font-black font-headline text-white">{isOutfitter ? "Company Logo" : "Profile Picture"}</h3>
        </div>
        <p className="text-sm text-off-white/70 font-medium mb-6 max-w-md leading-relaxed">
          A clear, recognizable logo builds brand trust for international hunters.
        </p>
        <div className="relative inline-block">
          <button type="button" className="bg-kalahari/10 hover:bg-kalahari/20 text-kalahari border border-kalahari/30 font-bold px-6 py-2 rounded-xl transition-all">
            Upload New Photo
          </button>
          <input type="file" accept="image/*" onChange={onImageSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        </div>
      </div>
    </div>
  );
}