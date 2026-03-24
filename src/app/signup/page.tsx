"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase/client";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Target, Compass, ArrowRight, ShieldCheck } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [role, setRole] = useState<"HUNTER" | "OUTFITTER">("HUNTER");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: formData.name,
      });

      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        email: formData.email,
        role: role,
        createdAt: new Date().toISOString(),
        status: role === "OUTFITTER" ? "PENDING" : "ACTIVE", 
        profileImageUrl: "",
      });

      if (role === "HUNTER") {
        router.push("/hunter/dashboard");
      } else {
        router.push("/outfitter/dashboard");
      }

    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Try logging in.");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-off-white dark:bg-olive flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-olive dark:bg-kalahari rounded-xl flex items-center justify-center shadow-lg transform rotate-3 transition-colors">
            <Target className="h-10 w-10 text-kalahari dark:text-olive dark:text-off-white -rotate-3 transition-colors" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-4xl font-black font-headline text-olive dark:text-off-white dark:text-off-white tracking-tight transition-colors">
          Join Only-Hunts
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-olive dark:text-off-white/60 dark:text-off-white/60 transition-colors">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-kalahari hover:text-kalahari/80 transition-colors">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-black/30 py-8 px-4 shadow-xl border-2 border-kalahari/20 dark:border-kalahari/30 sm:rounded-2xl sm:px-10 transition-colors duration-300 backdrop-blur-sm">
          
          {/* Role Toggle */}
          <div className="flex p-1 space-x-1 bg-kalahari/10 dark:bg-black/40 rounded-xl mb-8 transition-colors">
            <button
              type="button"
              onClick={() => setRole("HUNTER")}
              className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${
                role === "HUNTER" 
                  ? "bg-white dark:bg-olive text-olive dark:text-off-white dark:text-kalahari shadow-sm border border-kalahari/20 dark:border-kalahari/40" 
                  : "text-olive dark:text-off-white/60 dark:text-off-white/50 hover:text-olive dark:text-off-white dark:hover:text-off-white hover:bg-white/50 dark:hover:bg-white/5"
              }`}
            >
              <Target className="h-4 w-4" /> I am a Hunter
            </button>
            <button
              type="button"
              onClick={() => setRole("OUTFITTER")}
              className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${
                role === "OUTFITTER" 
                  ? "bg-white dark:bg-olive text-olive dark:text-off-white dark:text-kalahari shadow-sm border border-kalahari/20 dark:border-kalahari/40" 
                  : "text-olive dark:text-off-white/60 dark:text-off-white/50 hover:text-olive dark:text-off-white dark:hover:text-off-white hover:bg-white/50 dark:hover:bg-white/5"
              }`}
            >
              <Compass className="h-4 w-4" /> I am an Outfitter
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800 font-bold text-sm flex items-start gap-3 transition-colors">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSignup}>
            <div>
              <label className="block text-sm font-bold text-olive dark:text-off-white dark:text-off-white mb-1.5 transition-colors">
                {role === "HUNTER" ? "Full Name" : "Company / Outfitter Name"}
              </label>
              <Input 
                name="name" 
                required 
                value={formData.name} 
                onChange={handleChange} 
                placeholder={role === "HUNTER" ? "John Doe" : "Safari Adventures LLC"} 
                className="h-12 border-kalahari/40 dark:border-kalahari/30 focus-visible:ring-olive dark:focus-visible:ring-kalahari font-medium bg-off-white dark:bg-black/50 dark:text-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-olive dark:text-off-white dark:text-off-white mb-1.5 transition-colors">Email Address</label>
              <Input 
                name="email" 
                type="email" 
                required 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="john@example.com" 
                className="h-12 border-kalahari/40 dark:border-kalahari/30 focus-visible:ring-olive dark:focus-visible:ring-kalahari font-medium bg-off-white dark:bg-black/50 dark:text-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-olive dark:text-off-white dark:text-off-white mb-1.5 transition-colors">Password</label>
              <Input 
                name="password" 
                type="password" 
                required 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="••••••••" 
                className="h-12 border-kalahari/40 dark:border-kalahari/30 focus-visible:ring-olive dark:focus-visible:ring-kalahari font-medium bg-off-white dark:bg-black/50 dark:text-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-olive dark:text-off-white dark:text-off-white mb-1.5 transition-colors">Confirm Password</label>
              <Input 
                name="confirmPassword" 
                type="password" 
                required 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                placeholder="••••••••" 
                className="h-12 border-kalahari/40 dark:border-kalahari/30 focus-visible:ring-olive dark:focus-visible:ring-kalahari font-medium bg-off-white dark:bg-black/50 dark:text-white transition-colors"
              />
            </div>

            {role === "OUTFITTER" && (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800 flex gap-3 mt-4 transition-colors">
                <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-amber-800 dark:text-amber-400 leading-relaxed">
                  Outfitter accounts require manual verification by our admin team before you can publish hunts to the marketplace.
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-olive dark:bg-kalahari hover:bg-olive/90 dark:hover:bg-kalahari/90 text-kalahari dark:text-olive dark:text-off-white font-black h-14 text-lg mt-6 shadow-md transition-all rounded-xl"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>Create {role === "HUNTER" ? "Hunter" : "Outfitter"} Account <ArrowRight className="ml-2 h-5 w-5" /></>
              )}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}