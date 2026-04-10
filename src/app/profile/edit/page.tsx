"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Camera, User, Save, ShieldCheck } from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [role, setRole] = useState<"HUNTER" | "OUTFITTER" | "">("");
  const [formData, setFormData] = useState({
    name: "",
    email: "", // Read-only for security
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) {
        router.push("/login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setRole(data.role);
          setFormData({
            name: data.name || auth.currentUser.displayName || "",
            email: data.email || auth.currentUser.email || "",
          });
          setImagePreview(data.profileImageUrl || null);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchUserData();
      else router.push("/login");
    });

    return () => unsubscribe();
  }, [router]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be smaller than 5MB.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

  // FINAL CLEAN VERSION WITH HARD REDIRECT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!auth.currentUser) return;
    if (!formData.name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    setSaving(true);

    try {
      let finalImageUrl = imagePreview; 

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `profile_images/${auth.currentUser.uid}_${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      await updateProfile(auth.currentUser, {
        displayName: formData.name,
        photoURL: finalImageUrl,
      });

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        name: formData.name,
        profileImageUrl: finalImageUrl,
        updatedAt: new Date().toISOString(),
      });

      if (role === "OUTFITTER") {
        try {
          await updateDoc(doc(db, "outfitters", auth.currentUser.uid), {
            profileImageUrl: finalImageUrl,
            updatedAt: new Date().toISOString(),
          });
        } catch (err) { console.error("Outfitter doc update skipped"); }
      } else if (role === "HUNTER") {
        try {
          await updateDoc(doc(db, "hunters", auth.currentUser.uid), {
            profileImageUrl: finalImageUrl,
            updatedAt: new Date().toISOString(),
          });
        } catch (err) { console.error("Hunter doc update skipped"); }
      }

      const targetDashboard = role === "OUTFITTER" ? "/outfitter/dashboard" : "/hunter/dashboard";
      
      // FIX: Force a hard browser reload to bust the Navbar state cache
      window.location.href = `${targetDashboard}?success=profile`;

    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError("Failed to update profile. Please try again.");
      setSaving(false);
    } 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-olive flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-kalahari" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-olive py-24 px-4 sm:px-6 lg:px-8 text-off-white font-body relative overflow-hidden">
      
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: "url('/armory-bg.jpg')" }}
      ></div>
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-0"></div>

      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <button 
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center text-sm font-bold text-kalahari hover:text-white transition-colors mb-4 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full border border-kalahari/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </button>
            <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tight text-white drop-shadow-md">
              Profile Settings
            </h1>
            <p className="text-off-white/70 font-medium mt-2">Manage your personal identity on Only-Hunts.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/40 text-red-200 p-4 rounded-xl border border-red-500/30 font-bold shadow-sm flex items-center backdrop-blur-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-black/20 backdrop-blur-md border border-kalahari/20 rounded-3xl p-6 md:p-10 shadow-2xl space-y-10">
          
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
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageSelect} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
            </div>
            
            <div className="text-center sm:text-left pt-2 flex-1">
              <h3 className="text-xl font-black font-headline text-white mb-2">Profile Picture</h3>
              <p className="text-sm text-off-white/70 font-medium mb-6 max-w-md leading-relaxed">
                A clear, recognizable photo builds trust and helps {role === "OUTFITTER" ? "hunters feel confident booking with you" : "outfitters verify your identity"}.
              </p>
              <div className="relative inline-block">
                <button type="button" className="bg-kalahari/10 hover:bg-kalahari/20 text-kalahari border border-kalahari/30 font-bold px-6 py-2 rounded-xl transition-all">
                  Upload New Photo
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageSelect} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-bold text-kalahari uppercase tracking-widest mb-3">
                {role === "OUTFITTER" ? "Company / Outfitter Name" : "Full Name"}
              </label>
              <Input 
                name="name" 
                required 
                value={formData.name} 
                onChange={handleTextChange} 
                className="h-14 bg-black/40 border-kalahari/30 text-white focus-visible:ring-kalahari font-bold text-lg rounded-xl shadow-inner placeholder:text-off-white/30" 
                placeholder="Enter your name"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-bold text-kalahari uppercase tracking-widest">
                  Email Address
                </label>
                <span className="text-[10px] font-black text-olive bg-kalahari px-2 py-0.5 rounded uppercase tracking-widest flex items-center shadow-sm">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Secure
                </span>
              </div>
              <Input 
                name="email" 
                disabled 
                value={formData.email} 
                className="h-14 bg-black/20 border-kalahari/10 text-off-white/50 font-medium cursor-not-allowed rounded-xl" 
              />
              <p className="text-xs text-off-white/40 mt-3 font-medium">For security purposes, email addresses cannot be changed directly. Contact support if you need an update.</p>
            </div>
          </div>

          <div className="pt-8 border-t border-kalahari/20 flex justify-end">
            <Button 
              type="submit" 
              disabled={saving} 
              className="w-full sm:w-auto bg-kalahari text-olive font-black h-14 px-10 text-lg shadow-lg hover:opacity-90 transition-all rounded-xl"
            >
              {saving ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Updating...</>
              ) : (
                <><Save className="h-5 w-5 mr-2" /> Save Profile</>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}