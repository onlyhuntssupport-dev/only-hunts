"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import WishlistButton from "./WishlistButton";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ClientWishlistLoader({ huntId }: { huntId: string }) {
  const router = useRouter();
  const [hunterId, setHunterId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkWishlist = async (uid: string) => {
      try {
        const ref = doc(db, "wishlists", uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const ids = snap.data().huntIds || [];
          setIsSaved(ids.includes(huntId));
        }
      } catch (e) {
        console.error("Error checking wishlist", e);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setHunterId(user.uid);
        checkWishlist(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [huntId]);

  // While checking auth, show a ghost button so the layout doesn't jump
  if (loading) {
    return (
      <Button variant="ghost" size="icon" disabled className="shrink-0 opacity-50">
        <Heart className="text-muted-foreground" />
      </Button>
    );
  }

  // If not logged in, show a button that redirects to login
  if (!hunterId) {
    return (
      <Button variant="ghost" size="icon" onClick={() => router.push("/login")} className="shrink-0" title="Log in to save">
        <Heart className="text-muted-foreground" />
      </Button>
    );
  }

  // If logged in, render your exact WishlistButton!
  return <WishlistButton huntId={huntId} hunterId={hunterId} isInitiallySaved={isSaved} />;
}