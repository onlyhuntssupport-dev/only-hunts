"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  User, Mail, Save, ShieldCheck, Camera,
  FileText, Target, Crosshair, MapPin, Briefcase 
} from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  role: string;
  profileImageUrl?: string;
  bio?: string;
  preferredWeapon?: string;
  dreamTarget?: string;
  companyName?: string;
  yearsInBusiness?: string;
  baseProvince?: string;
  companyBio?: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) {
        setIsLoading(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          setProfile(data);
          setFormData(data);
        } else {
          const defaultData = { name: "Hunter", email: auth.currentUser.email || "", role: "USER" };
          setProfile(defaultData);
          setFormData(defaultData);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchProfile();
      else setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setIsUploading(true);
    setSaveMessage({ type: "", text: "" });

    try {
      const storage = getStorage();
      const storageRef = ref(storage, `users/${auth.currentUser.uid}/avatar_${Date.now()}`);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { profileImageUrl: downloadURL });

      setProfile(prev => prev ? { ...prev, profileImageUrl: downloadURL } : null);
      setFormData(prev => ({ ...prev, profileImageUrl: downloadURL }));

      setSaveMessage({ type: "success", text: "Profile picture updated!" });
      setTimeout(() => setSaveMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Image upload error:", error);
      setSaveMessage({ type: "error", text: "Failed to upload image." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage({ type: "", text: "" });
    setIsSaving(true);

    try {
      if (!auth.currentUser) throw new Error("Not logged in");
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { ...formData });
      
      setProfile(formData as UserProfile);
      setSaveMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setSaveMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setSaveMessage({ type: "error", text: "Failed to update profile. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-grow bg-off-white flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 rounded-full border-4 border-kalahari/30 border-t-kalahari animate-spin"></div>
      </div>
    );
  }

  const role = profile?.role || "USER";
  const isOutfitter = role === "OUTFITTER";
  const isHunter = role === "USER" || role === "HUNTER";

  return (
    <div className="flex-grow bg-off-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black font-headline text-olive dark:text-off-white mb-2 uppercase tracking-tight">Account Settings</h1>
        <p className="text-olive dark:text-off-white/70 font-medium mb-8">Manage your profile, preferences, and account security.</p>

        <div className="bg-white rounded-xl border-2 border-kalahari/20 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            
            {/* Header / Avatar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 pb-8 border-b-2 border-kalahari/10">
              <div className="relative group">
                <input 
                  type="file" id="avatarUpload" accept="image/*" className="hidden" 
                  onChange={handleImageUpload} disabled={isUploading}
                />
                <label 
                  htmlFor="avatarUpload"
                  className={`relative h-24 w-24 rounded-full border-2 border-kalahari flex items-center justify-center shadow-inner shrink-0 overflow-hidden ${isUploading ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:border-olive transition-colors'}`}
                >
                  {profile?.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-kalahari/10 flex items-center justify-center">
                      <User className="h-10 w-10 text-kalahari" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-olive/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                      <div className="h-6 w-6 rounded-full border-2 border-olive border-t-transparent animate-spin"></div>
                    </div>
                  )}
                </label>
              </div>

              <div>
                <h2 className="text-2xl font-bold font-headline text-olive dark:text-off-white">{profile?.name || "My Profile"}</h2>
                <div className="flex items-center gap-2 mt-1 mb-2">
                  <span className="px-2.5 py-0.5 bg-olive/10 text-olive dark:text-off-white text-[10px] font-black uppercase tracking-widest rounded flex items-center gap-1">
                    <ShieldCheck size={12} /> {role}
                  </span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form className="space-y-8" onSubmit={handleSave}>
              
              {/* Universal Fields */}
              <div className="space-y-6">
                <h3 className="text-sm font-black text-kalahari uppercase tracking-widest border-b border-kalahari/20 pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="flex items-center text-sm font-black text-olive dark:text-off-white mb-2 uppercase tracking-wide">
                      <User className="h-4 w-4 mr-2 text-kalahari" /> Full Name
                    </label>
                    <input 
                      type="text" name="name"
                      value={formData.name || ""} onChange={handleChange}
                      className="w-full px-4 py-3 rounded bg-off-white border-2 border-kalahari/20 text-olive dark:text-off-white font-medium focus:outline-none focus:border-kalahari transition-colors"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-black text-olive dark:text-off-white mb-2 uppercase tracking-wide">
                      <Mail className="h-4 w-4 mr-2 text-kalahari" /> Email Address
                    </label>
                    <input 
                      type="email" value={profile?.email || ""} disabled
                      className="w-full px-4 py-3 rounded bg-kalahari/5 border-2 border-kalahari/10 text-olive dark:text-off-white/60 font-medium cursor-not-allowed"
                    />
                    <p className="text-[10px] font-bold text-kalahari mt-1.5 uppercase tracking-widest">Email managed by secure login</p>
                  </div>
                </div>
              </div>

              {/* Outfitter Fields */}
              {isOutfitter && (
                <div className="space-y-6 pt-4">
                  <h3 className="text-sm font-black text-kalahari uppercase tracking-widest border-b border-kalahari/20 pb-2">Business Profile</h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="flex items-center text-sm font-black text-olive dark:text-off-white mb-2 uppercase tracking-wide">
                        <Briefcase className="h-4 w-4 mr-2 text-kalahari" /> Company Name
                      </label>
                      <input 
                        type="text" name="companyName"
                        value={formData.companyName || ""} onChange={handleChange}
                        className="w-full px-4 py-3 rounded bg-off-white border-2 border-kalahari/20 text-olive dark:text-off-white font-medium focus:outline-none focus:border-kalahari transition-colors"
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-black text-olive dark:text-off-white mb-2 uppercase tracking-wide">
                        <MapPin className="h-4 w-4 mr-2 text-kalahari" /> Base Province/Region
                      </label>
                      <input 
                        type="text" name="baseProvince"
                        value={formData.baseProvince || ""} onChange={handleChange}
                        className="w-full px-4 py-3 rounded bg-off-white border-2 border-kalahari/20 text-olive dark:text-off-white font-medium focus:outline-none focus:border-kalahari transition-colors"
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-black text-olive dark:text-off-white mb-2 uppercase tracking-wide">
                        <User className="h-4 w-4 mr-2 text-kalahari" /> Years in Business
                      </label>
                      <input 
                        type="number" name="yearsInBusiness"
                        value={formData.yearsInBusiness || ""} onChange={handleChange}
                        className="w-full px-4 py-3 rounded bg-off-white border-2 border-kalahari/20 text-olive dark:text-off-white font-medium focus:outline-none focus:border-kalahari transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="flex items-center text-sm font-black text-olive dark:text-off-white mb-2 uppercase tracking-wide">
                        <FileText className="h-4 w-4 mr-2 text-kalahari" /> Company Bio & Philosophy
                      </label>
                      <textarea 
                        name="companyBio" rows={4}
                        value={formData.companyBio || ""} onChange={handleChange}
                        className="w-full px-4 py-3 rounded bg-off-white border-2 border-kalahari/20 text-olive dark:text-off-white font-medium focus:outline-none focus:border-kalahari transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Hunter Fields */}
              {isHunter && (
                <div className="space-y-6 pt-4">
                  <h3 className="text-sm font-black text-kalahari uppercase tracking-widest border-b border-kalahari/20 pb-2">Hunting Preferences</h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="flex items-center text-sm font-black text-olive dark:text-off-white mb-2 uppercase tracking-wide">
                        <Crosshair className="h-4 w-4 mr-2 text-kalahari" /> Preferred Weapon
                      </label>
                      <select 
                        name="preferredWeapon"
                        value={formData.preferredWeapon || ""} onChange={handleChange}
                        className="w-full px-4 py-3 rounded bg-off-white border-2 border-kalahari/20 text-olive dark:text-off-white font-medium focus:outline-none focus:border-kalahari transition-colors"
                      >
                        <option value="">Select Weapon...</option>
                        <option value="Rifle">Rifle</option>
                        <option value="Bow">Bow</option>
                        <option value="Muzzleloader">Muzzleloader</option>
                        <option value="Handgun">Handgun</option>
                        <option value="Mixed">Mixed / Any</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-black text-olive dark:text-off-white mb-2 uppercase tracking-wide">
                        <Target className="h-4 w-4 mr-2 text-kalahari" /> Dream Target
                      </label>
                      <input 
                        type="text" name="dreamTarget"
                        value={formData.dreamTarget || ""} onChange={handleChange}
                        className="w-full px-4 py-3 rounded bg-off-white border-2 border-kalahari/20 text-olive dark:text-off-white font-medium focus:outline-none focus:border-kalahari transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="flex items-center text-sm font-black text-olive dark:text-off-white mb-2 uppercase tracking-wide">
                        <FileText className="h-4 w-4 mr-2 text-kalahari" /> About Me (Bio)
                      </label>
                      <textarea 
                        name="bio" rows={3}
                        value={formData.bio || ""} onChange={handleChange}
                        className="w-full px-4 py-3 rounded bg-off-white border-2 border-kalahari/20 text-olive dark:text-off-white font-medium focus:outline-none focus:border-kalahari transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 mt-6 border-t-2 border-kalahari/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-grow">
                  {saveMessage.text && (
                    <span className={`text-sm font-bold px-3 py-1.5 rounded ${
                      saveMessage.type === 'success' ? 'bg-olive/10 text-olive dark:text-off-white' : 'bg-red-100 text-red-600'
                    }`}>
                      {saveMessage.text}
                    </span>
                  )}
                </div>
                <button 
                  type="submit" disabled={isSaving || isUploading}
                  className="w-full sm:w-auto bg-kalahari hover:bg-white text-olive dark:text-off-white font-black px-8 py-3 rounded flex items-center justify-center shadow-md transition-all border-2 border-kalahari uppercase tracking-widest text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? <div className="h-4 w-4 border-2 border-olive border-t-transparent rounded-full animate-spin mr-2"></div> : <Save className="h-4 w-4 mr-2" />}
                  {isSaving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}