"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { getOrCreateChat } from "@/app/actions/messages";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";

interface Props {
  outfitterId: string;
  huntId: string;
  huntTitle: string;
  outfitterName: string;
}

export default function MessageOutfitterButton({ outfitterId, huntId, huntTitle, outfitterName }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMessageClick = async () => {
    const user = auth.currentUser;
    
    // 1. If not logged in, force them to log in first
    if (!user) {
      router.push("/login");
      return;
    }

    // 2. Prevent Outfitters from messaging themselves
    if (user.uid === outfitterId) {
      alert("You cannot message yourself.");
      return;
    }

    setLoading(true);

    try {
      // 3. Grab the Hunter's name for the chat room data
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const hunterName = userDoc.exists() ? (userDoc.data().name || "Hunter") : "Hunter";

      // 4. Fire the server action to get/create the room
      const res = await getOrCreateChat(
        user.uid,
        outfitterId,
        huntId,
        huntTitle,
        hunterName,
        outfitterName
      );

      // 5. Route to the room
      if (res.success && res.chatId) {
        router.push(`/messages/${res.chatId}`);
      } else {
        alert("Failed to start conversation. Please try again.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Chat routing error:", error);
      alert("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleMessageClick} 
      disabled={loading}
      variant="outline"
      className="w-full mt-4 border-2 border-kalahari/50 text-olive dark:text-off-white hover:bg-kalahari/10 font-black h-12 rounded-xl transition-all flex items-center justify-center gap-2"
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />}
      {loading ? "Opening secure chat..." : "Message Outfitter"}
    </Button>
  );
}