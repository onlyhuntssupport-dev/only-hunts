"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase/client"; 
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, User, Building, Mail, Camera, ShieldAlert } from "lucide-react";

export default function OutfitterSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "", 
    bio: "",
    profileImageUrl: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFormData({
            name: data.name || "",
            companyName: data.companyName || data.name || "",
            email: data.email || auth.currentUser.email || "",
            bio: data.bio || "",
            profileImageUrl: data.profileImageUrl || "",
          });
          if (data.profileImageUrl) setImagePreview(data.profileImageUrl);
        } else {
          setFormData(prev => ({ ...prev, email: auth.currentUser?.email || "" }));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchUserData();
      else setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const containsRestrictedContent = (text: string) => {
    if (!text) return false;
    const phoneRegex = /(?:[-+() ]*\d){8,}/;
    const urlRegex = /([a-zA-Z0-9\-]+\.(com|co\.za|net|org|info|biz|me|za))|(https?:\/\/)|(www\.)/i;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i;
    return phoneRegex.test(text) || urlRegex.test(text) || emailRegex.test(text);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (containsRestrictedContent(formData.bio) || containsRestrictedContent(formData.companyName)) {
      setMessage({ 
        type: "error", 
        text: "Platform Security: Phone numbers, emails, and website links are not allowed in your Company Name or Bio. Please remove them to save." 
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return; 
    }

    if (!auth.currentUser) return;
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      let finalImageUrl = formData.profileImageUrl;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `profiles/${auth.currentUser.uid}_${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, {
        name: formData.name,
        companyName: formData.companyName,
        bio: formData.bio,
        profileImageUrl: finalImageUrl,
        updatedAt: new Date().toISOString(),
      });
      
      setFormData(prev => ({ ...prev, profileImageUrl: finalImageUrl }));
      setImageFile(null); 
      setMessage({ type: "success", text: "Profile updated successfully. Redirecting to your public storefront..." });
      
      // --- THE DOPAMINE LOOP: Redirect them to their live storefront after 1.5 seconds ---
      setTimeout(() => {
        router.push(`/outfitters/${auth.currentUser?.uid}`);
      }, 1500);

    } catch (error: any) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Failed to update profile. Please try again." });
      setSaving(false);
    } 
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-kalahari" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="border-b-2 border-kalahari/30 pb-6">
        <h1 className="text-4xl font-headline font-bold text-olive dark:text-off-white tracking-tight">Profile Management</h1>
        <p className="text-olive dark:text-off-white/70 mt-2 text-lg font-medium">
          Manage how your business appears to hunters on the platform.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg border-2 font-bold shadow-sm transition-all flex items-start gap-3 ${
          message.type === "success" 
            ? "bg-green-50 text-green-800 border-green-200" 
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          {message.type === "error" && <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />}
          <p>{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border-2 border-kalahari/30 rounded-xl p-6 md:p-8 shadow-sm space-y-10">
        
        {/* Profile Picture Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-kalahari/20">
          <div className="relative h-28 w-28 rounded-full border-4 border-off-white shadow-md bg-kalahari/20 flex items-center justify-center overflow-hidden shrink-0">
            {imagePreview ? (
              <img src={imagePreview} alt="Profile Preview" className="h-full w-full object-cover" />
            ) : (
              <User className="h-12 w-12 text-olive dark:text-off-white/30" />
            )}
            <input type="file" id="profileImage" accept="image/*" className="hidden" onChange={handleImageSelect} />
          </div>
          
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold font-headline text-olive dark:text-off-white mb-1">Profile Photo</h2>
            <p className="text-sm text-olive dark:text-off-white/60 font-medium mb-3 max-w-sm">
              Upload a clear photo of yourself or your company logo. This helps build trust with hunters.
            </p>
            <label htmlFor="profileImage" className="inline-flex items-center gap-2 px-4 py-2 bg-off-white hover:bg-kalahari/20 text-olive dark:text-off-white border-2 border-kalahari/50 rounded-md font-bold text-sm cursor-pointer transition-colors shadow-sm">
              <Camera className="h-4 w-4 text-kalahari" />
              {imagePreview ? "Change Photo" : "Upload Photo"}
            </label>
          </div>
        </div>

        {/* Personal Details */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-headline text-olive dark:text-off-white border-b border-kalahari/20 pb-2">Personal Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-olive dark:text-off-white mb-1.5 flex items-center gap-2">
                <User className="h-4 w-4 text-kalahari" /> Full Name
              </label>
              <Input name="name" value={formData.name} onChange={handleChange} required className="h-12 border-kalahari/50 focus-visible:ring-olive font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-olive dark:text-off-white mb-1.5 flex items-center gap-2">
                <Mail className="h-4 w-4 text-kalahari" /> Email Address
              </label>
              <Input name="email" value={formData.email} disabled className="h-12 border-kalahari/50 bg-off-white text-olive dark:text-off-white/60 font-medium cursor-not-allowed" title="Email cannot be changed here" />
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-headline text-olive dark:text-off-white border-b border-kalahari/20 pb-2">Business Profile</h2>
          <div className="grid grid-cols-1 gap-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-bold text-olive dark:text-off-white mb-1.5 flex items-center gap-2">
                <Building className="h-4 w-4 text-kalahari" /> Outfitter / Company Name
              </label>
              <Input name="companyName" value={formData.companyName} onChange={handleChange} required className="h-12 border-kalahari/50 focus-visible:ring-olive font-medium" />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-bold text-olive dark:text-off-white mb-1.5">Company Bio / Description</label>
              <Textarea 
                name="bio" 
                value={formData.bio} 
                onChange={handleChange} 
                rows={5}
                placeholder="Tell hunters a bit about your operation, history, and what makes your hunts special..."
                className="border-kalahari/50 focus-visible:ring-olive font-medium text-base resize-none" 
              />
              <p className="text-[11px] font-bold text-olive dark:text-off-white/60 mt-2 uppercase tracking-wide">
                * Note: For platform security, phone numbers, emails, and website links are strictly prohibited in your bio.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={saving} className="bg-olive hover:bg-olive/90 text-kalahari font-black text-lg h-12 px-8 shadow-md transition-all flex items-center gap-2">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}