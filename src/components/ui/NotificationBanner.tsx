"use client";

import { useState, useEffect } from "react";
import { AlertCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase/client";
import { requestPushPermission } from "@/lib/firebase/messaging";

export function NotificationBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission === "granted" || Notification.permission === "denied") {
      return;
    }

    // Only show the banner if they dismissed the big modal
    const declinedTimestamp = localStorage.getItem("push_prompt_declined");
    if (declinedTimestamp) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleEnable = async () => {
    if (!userId) {
      toast({ title: "Please log in", description: "You must be logged in to enable notifications.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const success = await requestPushPermission(userId);
      if (success) {
        setIsVisible(false);
        toast({
          title: "Bush Telegraph Enabled",
          description: "You're all set to receive instant alerts.",
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-kalahari text-white px-4 py-3 sm:px-6 lg:px-8 shadow-md relative z-50">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            Don't miss out on leads or quotes. Enable push notifications.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            onClick={handleEnable} 
            disabled={loading}
            size="sm" 
            variant="outline" 
            className="w-full sm:w-auto bg-white text-kalahari hover:bg-gray-100 font-bold whitespace-nowrap border-none"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enable Now"}
          </Button>
          <button 
            onClick={handleDismiss}
            className="text-white hover:text-gray-200 transition-colors p-1"
            aria-label="Dismiss banner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}