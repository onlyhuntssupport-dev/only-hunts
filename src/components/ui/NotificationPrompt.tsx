"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function NotificationPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if notifications are already granted or denied at the browser level
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission === "granted" || Notification.permission === "denied") {
      return;
    }

    const checkCooldown = () => {
      const declinedTimestamp = localStorage.getItem("push_prompt_declined");
      if (!declinedTimestamp) return true;

      const daysSinceDeclined = (Date.now() - parseInt(declinedTimestamp, 10)) / (1000 * 60 * 60 * 24);
      return daysSinceDeclined > 7; // 7-day cooldown
    };

    if (checkCooldown()) {
      // Delay the popup so it doesn't aggressively interrupt the initial page load
      const timer = setTimeout(() => setIsOpen(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDecline = () => {
    localStorage.setItem("push_prompt_declined", Date.now().toString());
    setIsOpen(false);
  };

  const handleAccept = async () => {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        setIsOpen(false);
        toast({
          title: "Bush Telegraph Enabled",
          description: "You're all set to receive instant alerts.",
        });
        // Future step: Wire this up to Firebase Cloud Messaging (FCM) tokens here
      } else {
        // If they click block on the browser level, we still close it and start the cooldown
        handleDecline();
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      handleDecline();
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
            Don't Let the Trail Go Cold.
          </DialogTitle>
          <DialogDescription className="text-base text-olive/80 dark:text-off-white/80 font-medium pt-2">
            Out here, timing is everything. Whether it’s a new booking lead knocking on your camp door, or an Outfitter accepting your custom quote—don't rely on smoke signals.
            <br /><br />
            Enable instant alerts to keep your finger on the trigger. You will only get messages from Hunters or Outfitters.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-6">
          <Button 
            onClick={handleAccept} 
            className="w-full bg-green-700 hover:bg-green-800 text-white font-bold h-12 text-md transition-all shadow-md hover:shadow-lg"
          >
            Turn on the Bush Telegraph
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleDecline}
            className="w-full text-olive/60 hover:text-olive dark:text-off-white/60 dark:hover:text-off-white font-medium"
          >
            I'll risk missing out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}