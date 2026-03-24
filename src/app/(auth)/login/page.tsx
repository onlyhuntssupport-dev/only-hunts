"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase/client";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Target, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Check Firestore to see if they are a Hunter, Outfitter, or Admin
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role?.toUpperCase() || "HUNTER"; 
        
        // --- OPTION A ROUTING FIX: Send Admins directly to /admin ---
        if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "SUPERADMIN") {
          router.push("/admin"); 
        } else if (role === "OUTFITTER") {
          router.push("/outfitter/dashboard");
        } else {
          router.push("/hunter/dashboard");
        }
      } else {
        router.push("/hunter/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password. Please try again.");
      } else {
        setError("Failed to sign in. Please try again.");
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
            <Target className="h-10 w-10 text-kalahari dark:text-off-white -rotate-3 transition-colors" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-4xl font-black font-headline text-olive dark:text-off-white tracking-tight transition-colors">
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-olive dark:text-off-white/60 transition-colors">
          New to Only-Hunts?{" "}
          <Link href="/signup" className="font-bold text-kalahari hover:text-kalahari/80 transition-colors">
            Create an account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-black/30 py-8 px-4 shadow-xl border-2 border-kalahari/20 dark:border-kalahari/30 sm:rounded-2xl sm:px-10 transition-colors duration-300 backdrop-blur-sm">
          
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800 font-bold text-sm flex items-start gap-3 transition-colors">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-bold text-olive dark:text-off-white mb-1.5 transition-colors">Email Address</label>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-olive dark:text-off-white transition-colors">Password</label>
                <div className="text-sm">
                  <a href="#" className="font-bold text-kalahari hover:text-kalahari/80 transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>
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

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-olive dark:bg-kalahari hover:bg-olive/90 dark:hover:bg-kalahari/90 text-kalahari dark:text-off-white font-black h-14 text-lg mt-6 shadow-md transition-all rounded-xl"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="ml-2 h-5 w-5" /></>
              )}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}