"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db, storage } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Camera, User, Save, ShieldCheck, Eye, UploadCloud, CheckCircle2 } from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [role, setRole] = useState<"HUNTER" | "OUTFITTER" | "">("");
  
  // STEP 1-5 DATA STATE
  const [formData, setFormData] = useState({
    name: "",
    email: "", // Read-only
    bio: "",
    policies: "",
    paystackId: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [existingGallery, setExistingGallery] = useState<string[]>([]);

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
          setRole(data.role?.toUpperCase() || "");
          setFormData({
            name: data.name || auth.currentUser.displayName || "",
            email: data.email || auth.currentUser.email || "",
            bio: data.bio || "",
            policies: data.policies || "",
            paystackId: data.paystackId || "",
          });
          setImagePreview(data.profileImageUrl || null);
          setExistingGallery(data.galleryUrls || []);
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

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setGalleryFiles((prev) => [...prev, ...filesArray]);
    }
  };

  // ENGINE: Calculates the 5-step progress
  const calculateProgress = (hasLogo: boolean, newGalleryCount: number) => {
    let steps = 0;
    if (hasLogo) steps++; // Step 1: Logo
    if (formData.bio.trim().length > 10) steps++; // Step 2: Bio
    if ((existingGallery.length + newGalleryCount) >= 3) steps++; // Step 3: Gallery (Min 3)
    if (formData.policies.trim().length > 10) steps++; // Step 4: Policies
    if (formData.paystackId.trim().length > 5) steps++; // Step 5: Paystack Integration
    return steps;
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
      let finalImageUrl = imagePreview; 

      // 1. Upload new profile logo if changed
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `profile_images/${auth.currentUser.uid}_${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      // 2. Upload new gallery files if any
      const newGalleryUrls: string[] = [];
      if (galleryFiles.length > 0) {
        for (const file of galleryFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `gallery/${auth.currentUser.uid}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const storageRef = ref(storage, fileName);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          newGalleryUrls.push(url);
        }
      }

      const finalGalleryUrls = [...existingGallery, ...newGalleryUrls];

      // 3. Calculate algorithmic rankings
      const completedSteps = calculateProgress(!!finalImageUrl, galleryFiles.length);
      const isPremium = completedSteps === 5;

      // 4. Base User Update
      await updateProfile(auth.currentUser, {
        displayName: formData.name,
        photoURL: finalImageUrl,
      });

      const baseUpdatePayload: any = {
        name: formData.name,
        profileImageUrl: finalImageUrl,
        updatedAt: new Date().toISOString(),
      };

      if (role === "OUTFITTER") {
        baseUpdatePayload.bio = formData.bio;
        baseUpdatePayload.policies = formData.policies;
        baseUpdatePayload.paystackId = formData.paystackId;
        baseUpdatePayload.galleryUrls = finalGalleryUrls;
        baseUpdatePayload.completedProfileSteps = completedSteps;
        baseUpdatePayload.isPremium = isPremium;
      }

      await updateDoc(doc(db, "users", auth.currentUser.uid), baseUpdatePayload);

      // 5. Role-Specific Collection Update
      if (role === "OUTFITTER") {
        try {
          await updateDoc(doc(db, "outfitters", auth.currentUser.uid), baseUpdatePayload);
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

  const isOutfitter = role === "OUTFITTER";

  return (
    <div className="min-h-screen bg-olive py-24 px-4 sm:px-6 lg:px-8 text-off-white font-body relative overflow-hidden">
      
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: "url('/armory-bg.jpg')" }}
      ></div>
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-0"></div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* CONTEXT HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-kalahari/20 pb-6">
          <div>
            <button 
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center text-sm font-bold text-kalahari hover:text-white transition-colors mb-4 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full border border-kalahari/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </button>
            <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tight text-white drop-shadow-md">
              {isOutfitter ? "Public Profile Setup" : "Profile Settings"}
            </h1>
            <p className="text-off-white/70 font-medium mt-2">
              {isOutfitter 
                ? "Complete all 5 steps to unlock your Premium Outfitter badge and maximize visibility." 
                : "Manage your personal identity on Only-Hunts."}
            </p>
          </div>
          
          {isOutfitter && (
            <Link href={`/outfitters/${auth.currentUser?.uid}`} target="_blank">
              <Button className="bg-black/40 hover:bg-black/60 border border-kalahari text-kalahari font-black shadow-lg transition-all flex items-center gap-2">
                <Eye className="h-4 w-4" /> View as Hunter
              </Button>
            </Link>
          )}
        </div>

        {error && (
          <div className="bg-red-900/40 text-red-200 p-4 rounded-xl border border-red-500/30 font-bold shadow-sm flex items-center backdrop-blur-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-black/20 backdrop-blur-md border border-kalahari/20 rounded-3xl p-6 md:p-10 shadow-2xl space-y-12">
          
          {/* STEP 1: LOGO / AVATAR */}
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
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                {isOutfitter && <span className="bg-kalahari text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Step 1</span>}
                <h3 className="text-xl font-black font-headline text-white">{isOutfitter ? "Company Logo" : "Profile Picture"}</h3>
              </div>
              <p className="text-sm text-off-white/70 font-medium mb-6 max-w-md leading-relaxed">
                A clear, recognizable photo builds trust and helps {isOutfitter ? "hunters feel confident booking with you" : "outfitters verify your identity"}.
              </p>
              <div className="relative inline-block">
                <button type="button" className="bg-kalahari/10 hover:bg-kalahari/20 text-kalahari border border-kalahari/30 font-bold px-6 py-2 rounded-xl transition-all">
                  Upload New Photo
                </button>
                <input type="file" accept="image/*" onChange={handleImageSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            </div>
          </div>

          {/* BASIC INFO */}
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-kalahari uppercase tracking-widest mb-3">
                {isOutfitter ? "Company Name" : "Full Name"}
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
                <label className="block text-sm font-bold text-kalahari uppercase tracking-widest">Email Address</label>
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
            </div>
          </div>

          {/* OUTFITTER EXCLUSIVE: PROGRESSIVE ONBOARDING STEPS */}
          {isOutfitter && (
            <>
              {/* STEP 2: BIO */}
              <div className="pt-6 border-t border-kalahari/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-kalahari text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Step 2</span>
                  <label className="block text-sm font-bold text-kalahari uppercase tracking-widest">Company Bio</label>
                </div>
                <p className="text-sm text-off-white/60 mb-4">Tell hunters about your experience, your concessions, and what makes your safaris unique.</p>
                <textarea 
                  name="bio"
                  value={formData.bio}
                  onChange={handleTextChange}
                  rows={5}
                  className="w-full bg-black/40 border border-kalahari/30 text-white focus:outline-none focus:ring-2 focus:ring-kalahari font-medium text-base rounded-xl p-4 shadow-inner placeholder:text-off-white/30 resize-none"
                  placeholder="We have been operating in the Limpopo province for over 20 years..."
                />
              </div>

              {/* STEP 3: GALLERY */}
              <div className="pt-6 border-t border-kalahari/20">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-kalahari text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Step 3</span>
                      <label className="block text-sm font-bold text-kalahari uppercase tracking-widest">Trophy Gallery</label>
                    </div>
                    <p className="text-sm text-off-white/60">Upload at least 3 high-quality images of past hunts, camps, or terrain.</p>
                  </div>
                  <span className="text-xs font-bold text-kalahari/80">
                    {existingGallery.length + galleryFiles.length} / 3 Required
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingGallery.map((url, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border-2 border-kalahari/30 relative">
                      <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1"><CheckCircle2 className="h-4 w-4 text-green-400" /></div>
                    </div>
                  ))}
                  {galleryFiles.map((file, i) => (
                    <div key={`new-${i}`} className="aspect-square rounded-xl overflow-hidden border-2 border-orange-500 relative opacity-80">
                      <img src={URL.createObjectURL(file)} alt={`New ${i}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="h-6 w-6 text-white animate-spin" /></div>
                    </div>
                  ))}
                  <div className="aspect-square rounded-xl border-2 border-dashed border-kalahari/40 bg-black/20 hover:bg-black/40 transition-colors flex flex-col items-center justify-center cursor-pointer relative group">
                    <UploadCloud className="h-8 w-8 text-kalahari/60 group-hover:text-kalahari mb-2 transition-colors" />
                    <span className="text-xs font-bold text-kalahari/80">Add Photos</span>
                    <input type="file" multiple accept="image/*" onChange={handleGallerySelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                </div>
              </div>

              {/* STEP 4: POLICIES */}
              <div className="pt-6 border-t border-kalahari/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-kalahari text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Step 4</span>
                  <label className="block text-sm font-bold text-kalahari uppercase tracking-widest">Cancellation & Refund Policies</label>
                </div>
                <p className="text-sm text-off-white/60 mb-4">Clear rules protect both you and the hunter. What happens if they cancel 30 days out?</p>
                <textarea 
                  name="policies"
                  value={formData.policies}
                  onChange={handleTextChange}
                  rows={4}
                  className="w-full bg-black/40 border border-kalahari/30 text-white focus:outline-none focus:ring-2 focus:ring-kalahari font-medium text-base rounded-xl p-4 shadow-inner placeholder:text-off-white/30 resize-none"
                  placeholder="Deposits are non-refundable within 60 days of the hunt start date..."
                />
              </div>

              {/* STEP 5: PAYSTACK */}
              <div className="pt-6 border-t border-kalahari/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-kalahari text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Step 5</span>
                  <label className="block text-sm font-bold text-kalahari uppercase tracking-widest">Paystack Merchant Routing ID</label>
                </div>
                <p className="text-sm text-off-white/60 mb-4">Link your Paystack account so funds from booked hunts can be routed directly to your local bank.</p>
                <Input 
                  name="paystackId" 
                  value={formData.paystackId} 
                  onChange={handleTextChange} 
                  className="h-14 bg-black/40 border-kalahari/30 text-white focus-visible:ring-kalahari font-mono text-lg rounded-xl shadow-inner placeholder:text-off-white/30" 
                  placeholder="e.g. PSTK_ACCT_987654321"
                />
              </div>
            </>
          )}

          {/* SAVE BUTTON */}
          <div className="pt-8 border-t border-kalahari/20 flex justify-end">
            <Button 
              type="submit" 
              disabled={saving} 
              className="w-full sm:w-auto bg-kalahari text-olive font-black h-14 px-10 text-lg shadow-lg hover:opacity-90 transition-all rounded-xl hover:-translate-y-1"
            >
              {saving ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Saving & Verifying...</>
              ) : (
                <><Save className="h-5 w-5 mr-2" /> Save & Update Profile</>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}