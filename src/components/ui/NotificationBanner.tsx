"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { requestPushPermission } from "@/lib/firebase/messaging";
import { BellRing, X, Loader2 } from "lucide-react";

export default function NotificationBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check if the browser supports notifications
    if (typeof window !== "undefined" && "Notification" in window) {
      // 2. Only show the banner if they haven't made a choice yet ("default" state)
      if (Notification.permission === "default") {
        setIsVisible(true);
      }
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setUserId(user.uid);
    });

    return () => unsubscribe();
  }, []);

  const handleEnable = async () => {
    if (!userId) {
      alert("Please log in to enable notifications.");
      return;
    }

    setLoading(true);
    try {
      const success = await requestPushPermission(userId);
      if (success) {
        setIsVisible(false); // Hide forever once successful
        alert("Success! Your device is now connected for instant alerts.");
      } else {
        alert("Permission denied. iPhone users: You must tap 'Share' and 'Add to Home Screen' first before Apple allows notifications.");
      }
    } catch (error) {
      console.error("Failed to enable notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-[#F97316] text-white px-4 py-3 shadow-md relative z-50 flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-300">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="bg-white/20 p-2 rounded-full shrink-0">
          <BellRing className="h-5 w-5 text-white animate-pulse" />
        </div>
        <p className="text-sm font-bold leading-tight">
          Never miss a booking lead! Enable push notifications to get instant alerts.
        </p>
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
        <button 
          onClick={handleEnable}
          disabled={loading}
          className="bg-white text-[#F97316] hover:bg-orange-50 text-xs font-black uppercase tracking-wider px-4 py-2 rounded shadow-sm transition-colors flex items-center justify-center min-w-[120px]"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enable Now"}
        </button>
        <button 
          onClick={() => setIsVisible(false)}
          className="p-2 hover:bg-white/20 rounded-full transition-colors focus:outline-none"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
}