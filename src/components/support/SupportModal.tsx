"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { auth, db } from "@/lib/firebase/client"; 
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { AlertTriangle, ShieldAlert, Wrench, X, Loader2, CheckCircle } from "lucide-react";

// --- CUSTOM SVG ICON: SAFETY VEST ---
const SafetyVestIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 2L12 8L8 2H4V22H20V2H16Z" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </svg>
);

interface SupportModalProps {
  variant?: "sidebar" | "header";
}

export default function SupportModal({ variant = "sidebar" }: SupportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState<"BOOKING_ISSUE" | "SAFETY_CONCERN" | "TECH_ISSUE" | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setErrorMsg(null); 
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = async () => {
    setErrorMsg(null); 

    if (!category) {
      setErrorMsg("Please select a category above.");
      return;
    }
    if (message.trim().length < 10) {
      setErrorMsg("Please provide at least a few words describing your issue.");
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be logged in to submit a ticket.");
      }

      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.exists() ? userDocSnap.data() : {};

      await addDoc(collection(db, "supportTickets"), {
        userId: currentUser.uid,
        userEmail: currentUser.email || userData.email || "No Email",
        userName: userData.displayName || userData.name || userData.companyName || "Unknown User",
        userRole: userData.role || "UNKNOWN",
        category: category,
        message: message,
        status: "OPEN",
        createdAt: new Date().toISOString(),
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setCategory(null);
        setMessage("");
      }, 3000);

    } catch (err: any) {
      console.error("Direct DB submission error:", err);
      setErrorMsg(err.message || "Failed to submit ticket. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-kalahari/20 animate-in zoom-in-95 duration-200">
        
        <div className="p-6 border-b border-kalahari/10 flex justify-between items-center bg-off-white dark:bg-stone-950">
          <div className="flex items-center gap-3">
            <div className="bg-[#FF5F15]/10 p-2 rounded-lg">
              <SafetyVestIcon className="h-6 w-6 text-[#FF5F15]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-olive dark:text-off-white">Only-Hunts Support</h2>
              <p className="text-xs font-bold text-olive/50 dark:text-off-white/50 uppercase tracking-widest mt-1">Admin Resolution Center</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-2 bg-kalahari/10 hover:bg-red-100 text-kalahari hover:text-red-600 rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {isSuccess ? (
            <div className="py-10 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-2xl font-black text-olive dark:text-white mb-2">Ticket Submitted</h3>
              <p className="text-olive/70 dark:text-off-white/70 font-medium">
                Our admin team has received your request and will reach out to you shortly via your inbox.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              <div className="space-y-3">
                <label className="text-xs font-black text-olive/50 dark:text-off-white/50 uppercase tracking-widest">
                  1. What do you need help with?
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <CategoryButton 
                    selected={category === "BOOKING_ISSUE"} 
                    onClick={() => setCategory("BOOKING_ISSUE")} 
                    icon={AlertTriangle} 
                    label="Booking / Quote Issue" 
                    color="orange"
                  />
                  <CategoryButton 
                    selected={category === "SAFETY_CONCERN"} 
                    onClick={() => setCategory("SAFETY_CONCERN")} 
                    icon={ShieldAlert} 
                    label="Report User / Safety Concern" 
                    color="red"
                  />
                  <CategoryButton 
                    selected={category === "TECH_ISSUE"} 
                    onClick={() => setCategory("TECH_ISSUE")} 
                    icon={Wrench} 
                    label="Technical / Account Help" 
                    color="blue"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-kalahari/10">
                <label className="text-xs font-black text-olive/50 dark:text-off-white/50 uppercase tracking-widest">
                  2. Provide Details
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please include relevant quote numbers, user names, or a description of your issue..."
                  className="w-full h-32 p-4 bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#FF5F15] transition-all outline-none text-olive dark:text-off-white resize-none"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-bold animate-in fade-in slide-in-from-bottom-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="w-full h-14 bg-[#FF5F15] hover:bg-[#E55310] text-white font-black text-lg rounded-xl shadow-md transition-all flex justify-center items-center disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Submit to Admin Team"}
              </button>

            </div>
          )}
        </div>
        
      </div>
    </div>
  );

  return (
    <>
      {variant === "sidebar" ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-lg text-[#FF5F15]/80 hover:bg-[#FF5F15]/10 hover:text-[#FF5F15] transition-all text-left"
        >
          <SafetyVestIcon className="h-4 w-4 shrink-0" />
          <span>Contact Support</span>
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-[#FF5F15] hover:bg-[#E55310] text-white font-black py-2 px-3 sm:px-4 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <SafetyVestIcon className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Support</span>
        </button>
      )}

      {mounted && isOpen && createPortal(modalContent, document.body)}
    </>
  );
}

function CategoryButton({ selected, onClick, icon: Icon, label, color }: any) {
  const baseClasses = "flex items-center gap-3 p-4 border-2 rounded-xl text-sm font-black transition-all text-left w-full";
  const colorMap: any = {
    orange: selected ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" : "border-kalahari/10 hover:border-orange-200 text-olive dark:text-off-white",
    red: selected ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" : "border-kalahari/10 hover:border-red-200 text-olive dark:text-off-white",
    blue: selected ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : "border-kalahari/10 hover:border-blue-200 text-olive dark:text-off-white",
  };

  return (
    <button type="button" onClick={onClick} className={`${baseClasses} ${colorMap[color]}`}>
      <Icon className={`h-5 w-5 ${selected ? '' : 'text-kalahari/50'}`} />
      {label}
    </button>
  );
}