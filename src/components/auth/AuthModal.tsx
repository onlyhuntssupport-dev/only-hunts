"use client";

import { useEffect } from "react";
import { X, CheckCircle, ShieldCheck, Target, DollarSign } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import AuthForm from "@/components/auth/AuthForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  // Automatically close the modal if the user successfully logs in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && isOpen) {
        onClose();
      }
    });
    return () => unsubscribe();
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="bg-white dark:bg-stone-950 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-kalahari/20 relative flex flex-col md:flex-row max-h-[95vh]">
        
        {/* Close Button - Floats over everything */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-olive dark:text-white" />
        </button>

        {/* LEFT COLUMN: The Hook (Marketing Value Stack) */}
        <div className="w-full md:w-5/12 bg-olive relative p-8 md:p-12 flex flex-col justify-center shrink-0 overflow-hidden">
          {/* Background Texture */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
          
          <div className="relative z-10 text-white">
            <h2 className="text-3xl md:text-4xl font-black font-headline text-kalahari mb-2 tracking-tight">
              Unlock the Full Experience.
            </h2>
            <p className="text-white/80 font-medium mb-8">
              Create a free Hunter account to access premium features and book with confidence.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-1 bg-kalahari/20 p-2 rounded-lg shrink-0">
                  <Target className="h-5 w-5 text-kalahari" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Verified Outfitters</h4>
                  <p className="text-sm text-white/70">Unlock outfitter names and direct contact information.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 bg-kalahari/20 p-2 rounded-lg shrink-0">
                  <DollarSign className="h-5 w-5 text-kalahari" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Exact Pricing</h4>
                  <p className="text-sm text-white/70">Access transparent pricing matrices and request bespoke quotes.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 bg-kalahari/20 p-2 rounded-lg shrink-0">
                  <ShieldCheck className="h-5 w-5 text-kalahari" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Best Price Guarantee</h4>
                  <p className="text-sm text-white/70">Never pay more. We guarantee parity with outfitter direct pricing.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The Action (Existing Auth Form) */}
        <div className="w-full md:w-7/12 bg-off-white dark:bg-stone-950 p-6 md:p-12 flex items-center justify-center overflow-y-auto custom-scrollbar">
          {/* We wrap AuthForm in a div to override its default top margin if needed */}
          <div className="w-full [&>div]:mt-0 [&>div]:shadow-none [&>div]:border-none [&>div]:bg-transparent">
            <AuthForm />
          </div>
        </div>

      </div>
    </div>
  );
}