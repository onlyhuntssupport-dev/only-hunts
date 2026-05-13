"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BellRing, Loader2, Share, PlusSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase/client";
import { requestPushPermission } from "@/lib/firebase/messaging";

export function NotificationPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isIOSNeedsPWA, setIsIOSNeedsPWA] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Precise iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    
    // 2. Standalone (PWA) Detection
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        ('standalone' in window.navigator && (window.navigator as any).standalone);

    // 3. Web Push API Support Check
    const isPushSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

    // Abort if already granted or denied
    if (isPushSupported && (Notification.permission === "granted" || Notification.permission === "denied")) {
      return;
    }

    // Determine the UI state based on Apple's restrictions
    if (isIOS && !isStandalone) {
      setIsIOSNeedsPWA(true);
    } else if (!isPushSupported && !isIOS) {
      // Abort silently if the browser just doesn't support Web Push
      return;
    }

    const checkCooldown = () => {
      const declinedTimestamp = localStorage.getItem("push_prompt_declined");
      if (!declinedTimestamp) return true;
      const daysSinceDeclined = (Date.now() - parseInt(declinedTimestamp, 10)) / (1000 * 60 * 60 * 24);
      return daysSinceDeclined > 7; 
    };

    if (checkCooldown()) {
      const timer = setTimeout(() => setIsOpen(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDecline = () => {
    localStorage.setItem("push_prompt_declined", Date.now().toString());
    setIsOpen(false);
  };

  const handleAccept = async () => {
    if (!userId) {
      toast({ title: "Please log in", description: "You must be logged in to enable notifications.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const success = await requestPushPermission(userId);
      
      if (success) {
        setIsOpen(false);
        toast({
          title: "Bush Telegraph Enabled",
          description: "You're all set to receive instant alerts.",
        });
      } else {
        handleDecline();
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      handleDecline();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDecline()}>
      <DialogContent className="sm:max-w-md border-2 border-kalahari/30 dark:border-kalahari/40 bg-white dark:bg-olive shadow-2xl">
        <DialogHeader className="flex flex-col items-center sm:items-start text-center sm:text-left pt-4">
          <div className="mx-auto sm:mx-0 w-12 h-12 bg-kalahari/10 dark:bg-kalahari/20 text-kalahari rounded-full flex items-center justify-center mb-4 border border-kalahari/20">
            <BellRing className="w-6 h-6 animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-black text-olive dark:text-off-white">
            {isIOSNeedsPWA ? "Install App for Alerts" : "Don't Let the Trail Go Cold."}
          </DialogTitle>
          <DialogDescription className="text-base text-olive/80 dark:text-off-white/80 font-medium pt-2 text-left">
            {isIOSNeedsPWA ? (
               <>
                 Apple requires you to add Only-Hunts to your Home Screen before we can send you instant booking alerts.
                 <br /><br />
                 <span className="flex items-center gap-2 text-olive dark:text-off-white font-bold bg-black/5 dark:bg-white/5 p-3 rounded-lg border border-black/10 dark:border-white/10">
                   1. Tap the <Share className="h-5 w-5 text-blue-500 shrink-0" /> Share button below.
                 </span>
                 <span className="flex items-center gap-2 text-olive dark:text-off-white font-bold bg-black/5 dark:bg-white/5 p-3 rounded-lg border border-black/10 dark:border-white/10 mt-2">
                   2. Select <PlusSquare className="h-5 w-5 text-gray-500 shrink-0" /> "Add to Home Screen".
                 </span>
                 <br />
                 Once installed, open the app from your home screen and we'll connect the Bush Telegraph.
               </>
            ) : (
               <>
                 Out here, timing is everything. Whether it’s a new booking lead knocking on your camp door, or an Outfitter accepting your custom quote—don't rely on smoke signals.
                 <br /><br />
                 Enable instant alerts to keep your finger on the trigger. You will only get messages from Hunters or Outfitters.
               </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          {!isIOSNeedsPWA && (
            <Button 
              onClick={handleAccept} 
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold h-12 text-md transition-all shadow-md hover:shadow-lg"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Turn on the Bush Telegraph"}
            </Button>
          )}
          <Button 
            variant={isIOSNeedsPWA ? "primary" : "ghost"} 
            onClick={handleDecline}
            disabled={loading}
            className={`w-full font-medium ${isIOSNeedsPWA ? "bg-kalahari hover:bg-kalahari/90 text-white font-black h-12 shadow-md" : "text-olive/60 hover:text-olive dark:text-off-white/60 dark:hover:text-off-white"}`}
          >
            {isIOSNeedsPWA ? "Got it, I'll do it now" : "I'll risk missing out"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}