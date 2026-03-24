"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Camera, User, Save } from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [role, setRole] = useState<"HUNTER" | "OUTFITTER" | "">("");
  const [formData, setFormData] = useState({
    name: "",
    email: "", // We keep email read-only for security in this basic version
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
      // Basic validation (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be smaller than 5MB.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

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
      let finalImageUrl = imagePreview; // Default to existing if no new file

      // 1. Upload new image if one was selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `profile_images/${auth.currentUser.uid}_${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      // 2. Update Firebase Auth Profile (for quick access)
      await updateProfile(auth.currentUser, {
        displayName: formData.name,
        photoURL: finalImageUrl,
      });

      // 3. Update Firestore Database (for deep app data)
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        name: formData.name,
        profileImageUrl: finalImageUrl,
        updatedAt: new Date().toISOString(),
      });

      // 4. INSTANT REDIRECT with a success tag in the URL
      const targetDashboard = role === "OUTFITTER" ? "/outfitter/dashboard" : "/hunter/dashboard";
      router.push(`${targetDashboard}?success=profile`);

    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to update profile. Please try again.");
      setSaving(false);
    } 
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-kalahari" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b-2 border-kalahari/30 pb-6">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.back()}
            className="h-10 w-10 rounded-full border-kalahari/50 text-olive dark:text-off-white hover:bg-kalahari/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-headline font-black text-olive dark:text-off-white tracking-tight">Profile Settings</h1>
            <p className="text-olive dark:text-off-white/70 font-medium">Update your personal information and photo.</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 font-bold shadow-sm animate-in fade-in">
            {error}
          </div>
        )}

        {/* The Form */}
        <form onSubmit={handleSubmit} className="bg-white border-2 border-kalahari/20 rounded-2xl p-6 md:p-10 shadow-sm space-y-8">
          
          {/* Profile Picture Upload Section */}
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-8 border-b-2 border-kalahari/10 pb-8">
            <div className="relative group cursor-pointer">
              <div className="h-32 w-32 rounded-full border-4 border-kalahari/30 overflow-hidden bg-off-white flex items-center justify-center transition-all group-hover:border-kalahari shadow-md">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile Preview" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-16 w-16 text-olive dark:text-off-white/30" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageSelect} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
            </div>
            
            <div className="text-center sm:text-left pt-2">
              <h3 className="text-lg font-black font-headline text-olive dark:text-off-white">Profile Picture</h3>
              <p className="text-sm text-olive dark:text-off-white/60 mt-1 mb-4 max-w-sm">
                A clear, recognizable photo builds trust {role === "OUTFITTER" ? "with hunters looking to book" : "with outfitters"}.
              </p>
              <div className="relative inline-block">
                <Button type="button" variant="outline" className="border-kalahari/50 text-olive dark:text-off-white hover:bg-kalahari/10 font-bold">
                  Choose Image
                </Button>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageSelect} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-olive dark:text-off-white mb-2">
                {role === "OUTFITTER" ? "Company / Outfitter Name" : "Full Name"}
              </label>
              <Input 
                name="name" 
                required 
                value={formData.name} 
                onChange={handleTextChange} 
                className="h-14 border-kalahari/40 focus-visible:ring-olive font-bold text-lg bg-off-white" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-olive dark:text-off-white mb-2 flex justify-between">
                Email Address
                <span className="text-xs font-normal text-olive dark:text-off-white/50 bg-kalahari/10 px-2 py-0.5 rounded">Read-only</span>
              </label>
              <Input 
                name="email" 
                disabled 
                value={formData.email} 
                className="h-14 border-kalahari/20 text-olive dark:text-off-white/50 font-medium bg-gray-50 cursor-not-allowed" 
              />
              <p className="text-xs text-olive dark:text-off-white/50 mt-2 font-medium">To change your login email, please contact support.</p>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-6 border-t-2 border-kalahari/10 flex justify-end">
            <Button 
              type="submit" 
              disabled={saving} 
              className="w-full sm:w-auto bg-olive hover:bg-olive/90 text-kalahari font-black h-14 px-10 text-lg shadow-md transition-transform hover:-translate-y-0.5 rounded-xl"
            >
              {saving ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Saving...</>
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