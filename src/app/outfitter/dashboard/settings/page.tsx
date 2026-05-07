"use client";

import { useState, useEffect } from "react";
import { auth, db, storage } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  Save, User, MapPin, Home, Map, Medal, Image as ImageIcon, 
  CheckCircle, Loader2, X, UploadCloud, AlertCircle, Maximize2, FileText 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import KuduLoader from "@/components/ui/KuduLoader";

const ACCREDITATION_OPTIONS = [
  "PHASA (Professional Hunters' Association of South Africa)",
  "SCI (Safari Club International)",
  "WRSA (Wildlife Ranching South Africa)",
  "CHASA (Confederation of Hunting Associations of SA)",
  "DSC (Dallas Safari Club)",
  "Local Nature Conservation Approved"
];

const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape"
];

export default function OutfitterSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // --- DRAWER STATE ---
  const [activeDrawer, setActiveDrawer] = useState<"bio" | null>(null);

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    companyName: "",
    location: "",
    yearsInBusiness: "",
    bio: "",
    campType: "",
    terrain: "",
    accreditations: [] as string[],
    profileImageUrl: "",
    gallery: [] as string[],
  });

  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            companyName: data.companyName || data.name || "",
            location: data.location || "",
            yearsInBusiness: data.yearsInBusiness || "",
            bio: data.bio || "",
            campType: data.campType || "",
            terrain: data.terrain || "",
            accreditations: data.accreditations || [],
            profileImageUrl: data.profileImageUrl || "",
            gallery: data.gallery || [],
          });
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Failed to load your profile data.");
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => loadProfile(), 500);
    return () => clearTimeout(timer);
  }, []);

  // --- HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleAccreditation = (accreditation: string) => {
    setFormData((prev) => {
      const exists = prev.accreditations.includes(accreditation);
      if (exists) {
        return { ...prev, accreditations: prev.accreditations.filter(a => a !== accreditation) };
      } else {
        return { ...prev, accreditations: [...prev.accreditations, accreditation] };
      }
    });
  };

  // --- IMAGE UPLOAD LOGIC ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'gallery') => {
    const user = auth.currentUser;
    if (!user || !e.target.files || e.target.files.length === 0) return;

    setUploadingImage(true);
    setError("");

    try {
      const files = Array.from(e.target.files);
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const fileExtension = file.name.split('.').pop();
        const filePath = `outfitters/${user.uid}/${type}_${Date.now()}.${fileExtension}`;
        const storageRef = ref(storage, filePath);

        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(downloadUrl);
      }

      if (type === 'profile') {
        setFormData(prev => ({ ...prev, profileImageUrl: uploadedUrls[0] }));
      } else {
        setFormData(prev => ({ ...prev, gallery: [...prev.gallery, ...uploadedUrls] }));
      }

    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Failed to upload image. Please ensure it is a valid format and under 5MB.");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeGalleryImage = (urlToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter(url => url !== urlToRemove)
    }));
  };

  // --- SAVE LOGIC ---
  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setError("");

    try {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        companyName: formData.companyName,
        location: formData.location,
        yearsInBusiness: formData.yearsInBusiness,
        bio: formData.bio,
        campType: formData.campType,
        terrain: formData.terrain,
        accreditations: formData.accreditations,
        profileImageUrl: formData.profileImageUrl,
        gallery: formData.gallery,
        updatedAt: new Date().toISOString(),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center"><KuduLoader /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-16 transition-colors duration-300">
      
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black font-headline text-olive dark:text-off-white tracking-tight">Business Profile</h1>
        <p className="text-olive/70 dark:text-off-white/60 font-medium mt-2">Manage how your outfit appears to hunters on the marketplace.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-8">
        
        {/* SECTION 1: CORE BUSINESS INFO */}
        <section className="bg-white dark:bg-stone-900 border border-kalahari/20 rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-black text-olive dark:text-off-white border-b border-kalahari/10 pb-4 mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-kalahari" /> Core Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-2">Company Name</label>
              <input 
                type="text" name="companyName" value={formData.companyName} onChange={handleInputChange}
                className="w-full bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl p-3 text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari font-bold"
                placeholder="e.g. Kalahari Big Game Safaris"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-2">Primary Location (Province/Region)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-kalahari/50 pointer-events-none" />
                <select 
                  name="location" 
                  value={formData.location} 
                  onChange={handleInputChange}
                  className="w-full bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl p-3 pl-10 text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari font-medium appearance-none"
                >
                  <option value="" disabled>Select Province...</option>
                  {SA_PROVINCES.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-2">Years in Business</label>
              <input 
                type="text" name="yearsInBusiness" value={formData.yearsInBusiness} onChange={handleInputChange}
                className="w-full bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl p-3 text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari font-medium"
                placeholder="e.g. Est. 1998 or 25 Years"
              />
            </div>

            {/* BIO: FOCUS MODE UI */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-2">About the Outfitter (Bio)</label>
              <div className="bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 overflow-hidden">
                  {formData.bio ? (
                    <p className="text-olive dark:text-white/80 font-medium text-sm line-clamp-2 italic border-l-2 border-kalahari/50 pl-3">"{formData.bio}"</p>
                  ) : (
                    <p className="text-olive/40 dark:text-off-white/30 font-medium text-sm">No bio drafted yet.</p>
                  )}
                </div>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setActiveDrawer("bio")}
                  className="shrink-0 bg-white dark:bg-white/10 hover:bg-kalahari/10 dark:hover:bg-white/20 text-olive dark:text-white font-bold border-kalahari/30 dark:border-white/10 transition-colors"
                >
                  <Maximize2 className="h-4 w-4 mr-2 text-kalahari" /> Focus Editor
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: CAMP & TERRAIN */}
        <section className="bg-white dark:bg-stone-900 border border-kalahari/20 rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-black text-olive dark:text-off-white border-b border-kalahari/10 pb-4 mb-6 flex items-center gap-2">
            <Home className="h-5 w-5 text-kalahari" /> Camp & Terrain
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-2 flex items-center gap-2"><Home className="h-4 w-4" /> Accommodation Type</label>
              <select 
                name="campType" value={formData.campType} onChange={handleInputChange}
                className="w-full bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl p-3 text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari font-medium appearance-none"
              >
                <option value="">Select Lodge Type...</option>
                <option value="5-Star Luxury Lodge">5-Star Luxury Lodge</option>
                <option value="Premium Safari Lodge">Premium Safari Lodge</option>
                <option value="Traditional Tented Camp">Traditional Tented Camp</option>
                <option value="Rustic Bush Camp">Rustic Bush Camp</option>
                <option value="Farmhouse / Guesthouse">Farmhouse / Guesthouse</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-2 flex items-center gap-2"><Map className="h-4 w-4" /> Primary Terrain</label>
              <input 
                type="text" name="terrain" value={formData.terrain} onChange={handleInputChange}
                className="w-full bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl p-3 text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari font-medium"
                placeholder="e.g. Thick Bushveld, Open Plains, Mountainous"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: ACCREDITATIONS */}
        <section className="bg-white dark:bg-stone-900 border border-kalahari/20 rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-black text-olive dark:text-off-white border-b border-kalahari/10 pb-4 mb-6 flex items-center gap-2">
            <Medal className="h-5 w-5 text-kalahari" /> Professional Accreditations
          </h2>
          <p className="text-sm text-olive/70 dark:text-off-white/60 font-medium mb-6">Select the professional hunting organizations you are actively registered with. These build significant trust with international clients.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ACCREDITATION_OPTIONS.map((option) => (
              <label key={option} className="flex items-start gap-3 p-3 rounded-xl border border-kalahari/10 hover:border-kalahari/30 bg-off-white/50 dark:bg-stone-950/50 cursor-pointer transition-colors group">
                <input 
                  type="checkbox" 
                  checked={formData.accreditations.includes(option)}
                  onChange={() => toggleAccreditation(option)}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-kalahari focus:ring-kalahari bg-white dark:bg-stone-900"
                />
                <span className="text-sm font-bold text-olive dark:text-white group-hover:text-kalahari transition-colors">{option}</span>
              </label>
            ))}
          </div>
        </section>

        {/* SECTION 4: MEDIA & BRANDING */}
        <section className="bg-white dark:bg-stone-900 border border-kalahari/20 rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-black text-olive dark:text-off-white border-b border-kalahari/10 pb-4 mb-6 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-kalahari" /> Media & Branding
          </h2>
          
          <div className="space-y-10">
            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-bold text-olive dark:text-white mb-4">Outfitter Logo / Profile Picture</label>
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-kalahari/50 overflow-hidden bg-off-white dark:bg-stone-950 flex items-center justify-center shrink-0">
                  {formData.profileImageUrl ? (
                    <img src={formData.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-kalahari/30" />
                  )}
                </div>
                <div>
                  <input type="file" id="profile-upload" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'profile')} />
                  <label htmlFor="profile-upload" className="inline-flex items-center gap-2 px-4 py-2 bg-off-white dark:bg-stone-800 border border-kalahari/20 text-olive dark:text-white font-bold rounded-lg cursor-pointer hover:bg-kalahari/10 transition-colors">
                    <UploadCloud className="h-4 w-4 text-kalahari" /> {uploadingImage ? "Uploading..." : "Upload Logo"}
                  </label>
                  <p className="text-xs text-olive/50 dark:text-off-white/40 mt-2 font-medium">Recommended: Square image, max 2MB.</p>
                </div>
              </div>
            </div>

            {/* Trophy Room Gallery */}
            <div className="pt-8 border-t border-kalahari/10">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <label className="block text-sm font-bold text-olive dark:text-white">Trophy Room Gallery</label>
                  <p className="text-xs text-olive/60 dark:text-off-white/50 font-medium mt-1">Upload high-quality photos of your lodge and successful hunts.</p>
                </div>
                <input type="file" id="gallery-upload" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e, 'gallery')} />
                <label htmlFor="gallery-upload" className="inline-flex items-center gap-2 px-4 py-2 bg-kalahari hover:bg-kalahari/90 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-sm text-sm">
                  <UploadCloud className="h-4 w-4" /> Add Photos
                </label>
              </div>

              {formData.gallery.length === 0 ? (
                <div className="w-full py-12 border-2 border-dashed border-kalahari/20 rounded-xl bg-off-white/50 dark:bg-stone-950/50 flex flex-col items-center justify-center text-olive/40 dark:text-white/30">
                  <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                  <span className="text-sm font-bold">No gallery images uploaded yet</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {formData.gallery.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-kalahari/20 group">
                      <img src={url} alt={`Gallery ${i}`} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => removeGalleryImage(url)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all"
                          title="Remove Image"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {uploadingImage && (
                    <div className="aspect-square rounded-xl border-2 border-dashed border-kalahari/50 flex items-center justify-center bg-kalahari/5">
                      <Loader2 className="h-8 w-8 text-kalahari animate-spin" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PERMANENT SAVE SECTION */}
        <div className="mt-8 bg-white dark:bg-stone-900 border-2 border-kalahari/30 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
          <div className="text-olive/70 dark:text-gray-400 text-sm font-bold text-center sm:text-left">
            Unsaved changes will be lost. Make sure to save your profile.
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving || uploadingImage}
            className="w-full sm:w-auto bg-kalahari hover:bg-kalahari/90 text-white font-black px-10 py-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Saving Profile...</>
            ) : saveSuccess ? (
              <><CheckCircle className="h-5 w-5" /> Profile Updated</>
            ) : (
              <><Save className="h-5 w-5" /> Save Changes</>
            )}
          </button>
        </div>

      </div>

      {/* --- FOCUS MODE SLIDE-OUT DRAWER --- */}
      {activeDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full md:w-[600px] h-full bg-white dark:bg-stone-950 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-kalahari/20 flex flex-col animate-in slide-in-from-right duration-300">
            
            <div className="p-6 border-b border-kalahari/10 dark:border-white/5 flex justify-between items-center bg-off-white dark:bg-black/20">
              <h3 className="text-xl font-black font-headline text-olive dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-kalahari" />
                Draft Company Bio
              </h3>
              <button 
                type="button" 
                onClick={() => setActiveDrawer(null)}
                className="p-2 hover:bg-kalahari/10 dark:hover:bg-white/10 rounded-full transition-colors text-olive/50 hover:text-olive dark:text-white/50 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 p-6 flex flex-col bg-white dark:bg-stone-900/50">
              <p className="text-sm text-olive/60 dark:text-stone-400 mb-4">
                Take your time. A detailed bio increases booking conversions by establishing history and trust.
              </p>
              
              <textarea 
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="flex-1 w-full bg-off-white dark:bg-black/40 border border-kalahari/20 text-olive dark:text-white focus:outline-none focus:border-kalahari focus:ring-1 focus:ring-kalahari font-medium text-base rounded-2xl p-6 shadow-inner resize-none custom-scrollbar leading-relaxed"
                placeholder="Start typing your company history..."
                autoFocus
              />
            </div>

            <div className="p-6 border-t border-kalahari/10 dark:border-white/5 bg-off-white dark:bg-black/20 flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setActiveDrawer(null)}
                className="border-kalahari/30 text-olive dark:text-white hover:bg-kalahari/10 font-bold"
              >
                Close Editor
              </Button>
              <Button 
                type="button" 
                onClick={() => setActiveDrawer(null)}
                className="bg-kalahari hover:bg-kalahari/90 text-white dark:text-olive font-black"
              >
                <CheckCircle className="h-4 w-4 mr-2" /> Done Drafting
              </Button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}