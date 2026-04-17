"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/client"; // Reusing your existing Firebase client
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function WhatsAppWidget() {
  const phoneNumber = "27648405560"; 
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleWhatsAppClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // Stop the default link behavior
    
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // 1. Generate a clean, short Ticket ID
      const ticketId = `TK-${Math.floor(1000 + Math.random() * 9000)}`;

      // 2. Create the ticket in Firestore so it appears in your Admin Support Inbox
      await addDoc(collection(db, "supportTickets"), {
        ticketId: ticketId,
        status: "OPEN",
        source: "Global WhatsApp Widget",
        createdAt: serverTimestamp(),
        // Adding a date string makes filtering by day in the Analytics dashboard much easier
        dateString: new Date().toISOString().split('T')[0] 
      });

      // 3. Inject the Ticket ID into the WhatsApp message
      const message = `Hi Only-Hunts. I'm looking to tell my own story in the bushveld, but I need some help navigating the platform. [Ticket Ref: ${ticketId}]`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

      // 4. Route the user to WhatsApp
      window.open(whatsappUrl, '_blank');
      
    } catch (error) {
      console.error("Failed to generate ticket:", error);
      // Fallback: If the database write fails for any reason, still let them contact support
      const fallbackMsg = "Hi Only-Hunts. I'm looking to tell my own story in the bushveld, but I need some help navigating the platform.";
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(fallbackMsg)}`, '_blank');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end group">
      
      {/* Tooltip Hover State */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/90 text-off-white text-xs font-bold py-2 px-3 rounded-lg mb-2 border border-kalahari/30 shadow-lg pointer-events-none transform translate-y-1 group-hover:translate-y-0">
        Message Support (Text Only)
      </div>
      
      {/* The Button */}
      <a
        href="#"
        onClick={handleWhatsAppClick}
        className="bg-[#25D366] hover:bg-[#128C7E] p-4 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(37,211,102,0.6)] hover:scale-105 transition-all duration-300 flex items-center justify-center group relative overflow-hidden"
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-white animate-spin drop-shadow-md" />
        ) : (
          <svg
            className="w-8 h-8 text-white drop-shadow-md"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        )}
      </a>
    </div>
  );
}