"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase/client";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, CalendarDays, Users, MessageSquare, CheckCircle2, Lock } from "lucide-react";

interface LeadFormProps {
  huntId: string;
  outfitterId: string;
  huntTitle: string;
}

export default function LeadForm({ huntId, outfitterId, huntTitle }: LeadFormProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    preferredDates: "",
    partySize: "1",
    message: "I am interested in booking this package. Please let me know your availability."
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsAuthenticated(!!user);
      
      if (user) {
        if (user.displayName) {
          setFormData(prev => ({ ...prev, name: user.displayName as string }));
        }

        try {
          const offersRef = collection(db, "offers");
          const q = query(
            offersRef,
            where("hunterId", "==", user.uid),
            where("huntId", "==", huntId)
          );
          
          const snap = await getDocs(q);
          
          if (!snap.empty) {
            const fetchedOffers = snap.docs.map(doc => doc.data() as any);
            fetchedOffers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const latestOffer = fetchedOffers[0];
            
            setFormData(prev => ({
              ...prev,
              message: `Hi! I am reaching out to claim the exclusive offer you sent me:\n\n"${latestOffer.message}"\n\nI am very interested in booking this package. Please let me know your availability.`
            }));
          }
        } catch (err) {
          console.error("Error checking for VIP offers:", err);
        }
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [huntId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!auth.currentUser) {
      setError("You must be logged in to send an inquiry.");
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, "inquiries"), {
        huntId,
        huntTitle,
        outfitterId,
        hunterId: auth.currentUser.uid,
        hunterEmail: auth.currentUser.email,
        hunterName: formData.name,
        preferredDates: formData.preferredDates,
        partySize: Number(formData.partySize),
        message: formData.message,
        status: "NEW", 
        createdAt: new Date().toISOString(),
      });

      setSuccess(true);
    } catch (err: any) {
      console.error("Error submitting lead:", err);
      setError("Failed to send inquiry. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="animate-spin h-6 w-6 text-kalahari" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center shadow-sm animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        </div>
        <h3 className="text-lg font-black text-green-800 font-headline mb-1">Inquiry Sent!</h3>
        <p className="text-green-700 font-medium text-xs">
          The outfitter will contact you via the secure platform shortly.
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-kalahari/5 border-2 border-kalahari/20 rounded-lg p-5 text-center">
        <div className="mx-auto w-10 h-10 bg-kalahari/10 rounded-full flex items-center justify-center mb-3">
          <Lock className="h-5 w-5 text-kalahari" />
        </div>
        <h3 className="text-base font-black text-olive dark:text-off-white font-headline mb-1">Members Only</h3>
        <p className="text-olive dark:text-off-white/70 font-medium text-xs mb-4">
          Create a free account to securely message outfitters and book.
        </p>
        <div className="flex flex-col gap-2.5">
          <Link href="/login" className="w-full">
            <Button className="w-full h-10 bg-olive hover:bg-olive/90 text-kalahari font-black shadow-md">
              Log In
            </Button>
          </Link>
          <Link href="/register" className="w-full">
            <Button variant="outline" className="w-full h-10 border-2 border-kalahari/30 text-olive dark:text-off-white hover:bg-kalahari/10 font-black">
              Create Free Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-bold text-olive dark:text-off-white mb-1 flex items-center gap-1">
            Your Full Name
          </label>
          <Input 
            name="name" required value={formData.name} onChange={handleChange} 
            placeholder="John Doe" 
            className="h-9 border-kalahari/30 focus-visible:ring-kalahari font-medium text-sm" 
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-olive dark:text-off-white mb-1 flex items-center gap-1">
              <CalendarDays className="h-3 w-3 text-kalahari" /> Preferred Dates
            </label>
            <Input 
              name="preferredDates" required value={formData.preferredDates} onChange={handleChange} 
              placeholder="e.g. Oct 2026" 
              className="h-9 border-kalahari/30 focus-visible:ring-kalahari font-medium text-sm" 
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-olive dark:text-off-white mb-1 flex items-center gap-1">
              <Users className="h-3 w-3 text-kalahari" /> Hunters
            </label>
            <Input 
              name="partySize" required type="number" min="1" value={formData.partySize} onChange={handleChange} 
              className="h-9 border-kalahari/30 focus-visible:ring-kalahari font-medium text-sm" 
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-olive dark:text-off-white mb-1 flex items-center gap-1">
            <MessageSquare className="h-3 w-3 text-kalahari" /> Message
          </label>
          <Textarea 
            name="message" required value={formData.message} onChange={handleChange} 
            rows={3} 
            className="border-kalahari/30 focus-visible:ring-kalahari font-medium resize-none text-sm" 
          />
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={submitting} 
        className="w-full h-11 mt-1 bg-kalahari hover:bg-kalahari/90 text-white font-black text-base shadow-md transition-all flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {submitting ? "Sending..." : "Send Inquiry"}
      </Button>
    </form>
  );
}