"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, ShieldCheck, FileText, Target, MapPin } from "lucide-react";
import Link from "next/link";

export default function OutfitterRegistration() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: Form, 2: Success
  
  // NOTE: Phone number removed to enforce the on-platform Walled Garden rule
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    location: "",
    password: "",
  });
  const [permitFile, setPermitFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPermitFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permitFile) {
      setError("Please upload your professional outfitter permit or license.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Create User Login in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = userCredential.user.uid;

      // 2. Upload Permit to Firebase Storage
      const fileExtension = permitFile.name.split('.').pop();
      const fileName = `outfitter_permits/${uid}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, permitFile);
      const permitUrl = await getDownloadURL(storageRef);

      // 3. Create Outfitter Application Data (For Admin Review)
      await setDoc(doc(db, "outfitters", uid), {
        name: formData.name,
        email: formData.email,
        location: formData.location,
        permitUrl: permitUrl,
        status: "PENDING", // Crucial: Locks them out of the marketplace until admin approval
        totalListings: 0,
        createdAt: new Date().toISOString(),
      });

      // 4. AUTOMATION: Create Master User Profile with OUTFITTER Role
      // This ensures the Navbar, Settings page, and system instantly recognize them
      await setDoc(doc(db, "users", uid), {
        name: formData.name,
        email: formData.email,
        role: "OUTFITTER",
        createdAt: new Date().toISOString(),
      });

      // 5. Move to Success Screen
      setStep(2);
    } catch (err: any) {
      console.error("Registration Error:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 mb-6">
            <ShieldCheck className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-stone-900 tracking-tight">Application Submitted</h2>
          <p className="mt-4 text-stone-500 font-medium">
            Thank you for applying to join Only-Hunts. Our admin team is reviewing your permit and business details. 
          </p>
          <div className="mt-8 bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <p className="text-sm text-stone-600 mb-6">
              You will receive an email once your account is approved. Until then, your dashboard access is restricted.
            </p>
            <Button onClick={() => router.push("/")} className="w-full bg-amber-800 hover:bg-amber-900 text-white h-12 text-lg">
              Return to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Left side - Information */}
      <div className="hidden lg:flex lg:w-1/2 bg-stone-900 flex-col justify-between p-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1601255866032-68310118eb3a?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="relative z-10">
          <Link href="/" className="text-3xl font-black text-amber-500 tracking-tighter hover:text-amber-400 transition-colors">ONLY-HUNTS</Link>
          <h1 className="mt-20 text-5xl font-black tracking-tight leading-tight">
            Grow your hunting business globally.
          </h1>
          <p className="mt-6 text-xl text-stone-400 max-w-md">
            Join the premier marketplace for professional outfitters. Reach thousands of verified hunters looking for their next adventure.
          </p>
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="bg-amber-800/20 p-3 rounded-full"><Target className="h-6 w-6 text-amber-500" /></div>
            <p className="font-bold">Zero upfront listing fees</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-amber-800/20 p-3 rounded-full"><ShieldCheck className="h-6 w-6 text-amber-500" /></div>
            <p className="font-bold">Vetted, high-intent clients</p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white relative">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="lg:hidden mb-8">
             <Link href="/" className="text-3xl font-black text-amber-800 tracking-tighter">ONLY-HUNTS</Link>
          </div>
          
          <h2 className="text-3xl font-black text-stone-900 tracking-tight">Apply as an Outfitter</h2>
          <p className="mt-2 text-sm text-stone-500 font-bold uppercase tracking-widest">Partner Network</p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md text-sm font-bold border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Business Name</label>
                <Input name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. African Safari Co." className="h-12" disabled={loading} />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Email</label>
                <Input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="contact@company.com" className="h-12" disabled={loading} />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Primary Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                  <Input name="location" required value={formData.location} onChange={handleChange} placeholder="e.g. Limpopo, South Africa" className="h-12 pl-10" disabled={loading} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Password</label>
                <Input type="password" name="password" required minLength={6} value={formData.password} onChange={handleChange} placeholder="Create a strong password" className="h-12" disabled={loading} />
              </div>

              <div className="border-t border-stone-200 pt-4 mt-2">
                <label className="block text-sm font-bold text-stone-700 mb-1">Professional Permit / License</label>
                <p className="text-xs text-stone-500 mb-3">Please upload a PDF or image of your valid outfitter license for admin verification.</p>
                <div className="flex items-center justify-center w-full">
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-stone-300 border-dashed rounded-lg cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileText className="w-8 h-8 mb-3 text-stone-400" />
                      <p className="mb-2 text-sm text-stone-500">
                        <span className="font-bold text-amber-800">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-stone-500">{permitFile ? permitFile.name : "PDF, PNG, or JPG (Max 5MB)"}</p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} disabled={loading} />
                  </label>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-14 text-lg bg-amber-800 hover:bg-amber-900 text-white gap-2">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <>Submit Application <ArrowRight className="h-5 w-5" /></>
              )}
            </Button>
            
            <p className="text-center text-sm text-stone-500 font-medium">
              Already have an account? <Link href="/login" className="text-amber-800 font-bold hover:underline">Sign in here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}