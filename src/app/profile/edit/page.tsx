"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db, storage } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Save, Eye, Maximize2 } from "lucide-react";

import FocusEditorDrawer from "@/components/profile/FocusEditorDrawer";
import ProfileImageUploader from "@/components/profile/ProfileImageUploader";
import TrophyGalleryUploader from "@/components/profile/TrophyGalleryUploader";
import PaystackVerificationCard from "@/components/profile/PaystackVerificationCard";
import RegionalSelector from "@/components/profile/RegionalSelector";
import { SUPPORTED_COUNTRIES, REGION_DICTIONARY } from "@/lib/config/regions";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState<"HUNTER" | "OUTFITTER" | "">("");
  const [activeDrawer, setActiveDrawer] = useState<"bio" | "policies" | null>(null);
  
  const [formData, setFormData] = useState({
    name: "", email: "", bio: "", policies: "", paystackId: "", baseCountry: "South Africa", operatingRegions: [] as string[],
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [existingGallery, setExistingGallery] = useState<string[]>([]);

  const isOutfitter = useMemo(() => role === "OUTFITTER", [role]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return router.push("/login");
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          
          // DATA SANITIZER: Forces legacy database strings to match our exact dictionary casing
          const rawBaseC = data.baseCountry || data.location || "South Africa";
          const baseC = SUPPORTED_COUNTRIES.find(c => c.toLowerCase() === rawBaseC.trim().toLowerCase()) || "South Africa";
          
          const allowed = REGION_DICTIONARY[baseC] || [];
          const raw = data.operatingRegions || data.operatingCountries || [];
          
          setRole(data.role?.toUpperCase() || "");
          setFormData({
            name: data.name || auth.currentUser.displayName || "",
            email: data.email || auth.currentUser.email || "",
            bio: data.bio || "", policies: data.policies || "",
            paystackId: data.paystackId || "", baseCountry: baseC,
            operatingRegions: raw.filter((r: string) => allowed.includes(r)),
          });
          setImagePreview(data.profileImageUrl || null);
          setExistingGallery(data.galleryUrls || []);
        }
      } catch (err) { setError("Failed to load profile."); } finally { setLoading(false); }
    };
    const unsubscribe = auth.onAuthStateChanged(user => user ? fetchUserData() : router.push("/login"));
    return () => unsubscribe();
  }, [router]);

  const uploadImages = async () => {
    let profileUrl = imagePreview;
    if (imageFile) {
      const storageRef = ref(storage, `profile_images/${auth.currentUser?.uid}_${Date.now()}`);
      await uploadBytes(storageRef, imageFile);
      profileUrl = await getDownloadURL(storageRef);
    }
    const newGallery = await Promise.all(galleryFiles.map(async file => {
      const storageRef = ref(storage, `gallery/${auth.currentUser?.uid}_${Date.now()}_${Math.random().toString(36).substring(7)}`);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    }));
    return { profileUrl, galleryUrls: [...existingGallery, ...newGallery] };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !formData.name.trim()) return setError("Name is required.");
    setSaving(true);

    try {
      const { profileUrl, galleryUrls } = await uploadImages();
      const completedSteps = [!!profileUrl, formData.bio.length > 10, galleryUrls.length >= 3, formData.policies.length > 10, formData.paystackId.length > 5].filter(Boolean).length;

      await updateProfile(auth.currentUser, { displayName: formData.name, photoURL: profileUrl });

      const payload: any = {
        name: formData.name, profileImageUrl: profileUrl, updatedAt: new Date().toISOString(),
        ...(isOutfitter && { 
          bio: formData.bio, policies: formData.policies, paystackId: formData.paystackId, 
          galleryUrls, completedProfileSteps: completedSteps, isPremium: completedSteps === 5,
          baseCountry: formData.baseCountry, operatingRegions: formData.operatingRegions, location: formData.baseCountry 
        })
      };

      await updateDoc(doc(db, "users", auth.currentUser.uid), payload);
      const collection = isOutfitter ? "outfitters" : "hunters";
      await updateDoc(doc(db, collection, auth.currentUser.uid), payload).catch(() => null);

      window.location.href = isOutfitter ? "/outfitter/dashboard?success=profile" : "/hunter/dashboard?success=profile";
    } catch (err) { setError("Failed to update profile."); setSaving(false); }
  };

  if (loading) return <div className="min-h-screen bg-olive flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-kalahari" /></div>;

  return (
    <div className="min-h-screen bg-olive py-24 px-4 sm:px-6 lg:px-8 text-off-white font-body relative">
      <div className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none" style={{ backgroundImage: "url('/armory-bg.jpg')" }} />
      
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between border-b border-kalahari/20 pb-6">
          <div className="space-y-2">
            <button onClick={() => router.back()} className="flex items-center text-kalahari font-bold bg-black/20 px-4 py-2 rounded-full border border-kalahari/20 hover:text-white transition-colors"><ArrowLeft className="h-4 w-4 mr-2" /> Back</button>
            <h1 className="text-3xl md:text-5xl font-black font-headline text-white drop-shadow-md">{isOutfitter ? "Public Profile Setup" : "Profile Settings"}</h1>
          </div>
          {isOutfitter && <Link href={`/outfitters/${auth.currentUser?.uid}`} target="_blank"><Button className="border border-kalahari text-kalahari font-black bg-black/40 hover:bg-black/60 shadow-lg transition-all"><Eye className="h-4 w-4 mr-2" /> View as Hunter</Button></Link>}
        </div>

        {error && <div className="bg-red-900/40 text-red-200 p-4 rounded-xl border border-red-500/30 font-bold shadow-sm flex items-center backdrop-blur-md">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-black/20 backdrop-blur-md border border-kalahari/20 rounded-3xl p-6 md:p-10 space-y-12 shadow-2xl">
          <ProfileImageUploader imagePreview={imagePreview} isOutfitter={isOutfitter} onImageSelect={(e) => {
            const file = e.target.files?.[0];
            if (file && file.size < 5000000) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
          }} />

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="text-kalahari font-bold uppercase text-sm mb-3 block tracking-widest">{isOutfitter ? "Company Name" : "Full Name"}</label>
              <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-black/40 border-kalahari/30 text-white h-14 font-bold text-lg rounded-xl shadow-inner" />
            </div>
            <div>
              <label className="text-kalahari font-bold uppercase text-sm mb-3 block tracking-widest">Email</label>
              <Input disabled value={formData.email} className="bg-black/20 border-kalahari/10 opacity-50 h-14 rounded-xl font-medium" />
            </div>
            {isOutfitter && <RegionalSelector baseCountry={formData.baseCountry} operatingRegions={formData.operatingRegions} onChange={(upd) => setFormData({...formData, ...upd})} />}
          </div>

          {isOutfitter && <>
            <div className="pt-6 border-t border-kalahari/20">
              <label className="text-kalahari font-bold uppercase text-sm mb-3 block tracking-widest">Company Bio</label>
              <div className="bg-black/40 border border-kalahari/30 p-5 rounded-xl flex justify-between items-center gap-4">
                <p className="italic text-sm text-white/80 truncate max-w-lg border-l-2 border-kalahari/50 pl-3">{formData.bio || "No bio drafted."}</p>
                <Button type="button" onClick={() => setActiveDrawer("bio")} className="bg-white/10 hover:bg-white/20 text-white font-bold border border-white/10 shrink-0"><Maximize2 className="h-4 w-4 mr-2 text-kalahari" /> Focus Editor</Button>
              </div>
            </div>

            <TrophyGalleryUploader existingGallery={existingGallery} galleryFiles={galleryFiles} onGallerySelect={(e) => e.target.files && setGalleryFiles([...galleryFiles, ...Array.from(e.target.files)])} />

            <div className="pt-6 border-t border-kalahari/20">
              <label className="text-kalahari font-bold uppercase text-sm mb-3 block tracking-widest">Policies</label>
              <div className="bg-black/40 border border-kalahari/30 p-5 rounded-xl flex justify-between items-center gap-4">
                <p className="italic text-sm text-white/80 truncate max-w-lg border-l-2 border-kalahari/50 pl-3">{formData.policies || "No policies drafted."}</p>
                <Button type="button" onClick={() => setActiveDrawer("policies")} className="bg-white/10 hover:bg-white/20 text-white font-bold border border-white/10 shrink-0"><Maximize2 className="h-4 w-4 mr-2 text-kalahari" /> Focus Editor</Button>
              </div>
            </div>

            <PaystackVerificationCard baseCountry={formData.baseCountry} currentPaystackId={formData.paystackId} onVerificationSuccess={(id) => setFormData({...formData, paystackId: id})} />
          </>}

          <div className="pt-8 border-t border-kalahari/20 flex justify-end">
            <Button type="submit" disabled={saving} className="bg-kalahari text-olive font-black h-14 px-10 text-lg shadow-lg hover:opacity-90 transition-all rounded-xl hover:-translate-y-1">
              {saving ? <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Saving...</> : <><Save className="h-5 w-5 mr-2" /> Save Changes</>}
            </Button>
          </div>
        </form>
      </div>

      <FocusEditorDrawer activeDrawer={activeDrawer} content={activeDrawer ? formData[activeDrawer] : ""} onChange={(e) => setFormData({...formData, [activeDrawer!]: e.target.value})} onClose={() => setActiveDrawer(null)} />
    </div>
  );
}