"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Users, Target, Send, CheckCircle, MapPin, AlertTriangle } from "lucide-react";
import { db, auth } from "@/lib/firebase/client";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface CustomQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  outfitterId: string;
  outfitterName: string;
  // NEW: Accepted prop for checking date availability
  bookedDates?: {start: string, end: string}[];
}

const MASTER_SPECIES_LIST = [
  'Kudu (Bull)', 'Kudu (Cow)', 'Impala (Ram)', 'Impala (Ewe)', 
  'Gemsbok / Oryx', 'Springbok (Common)', 'Springbok (Black)', 
  'Springbok (White)', 'Springbok (Copper)', 'Blue Wildebeest', 
  'Golden Wildebeest', 'Black Wildebeest', 'Blesbok (Common)', 
  'Blesbok (White)', 'Zebra (Burchell)', 'Zebra (Hartmann)', 
  'Eland (Cape)', 'Eland (Livingstone)', 'Waterbuck', 'Nyala', 
  'Sable Antelope', 'Roan Antelope', 'Red Hartebeest', 'Bushbuck', 
  'Warthog', 'Giraffe', 'Ostrich', 'Leopard', 'Lion', 'Cape Buffalo', 
  'Elephant', 'Rhino', 'Hippo', 'Crocodile', 'Steenbok', 'Duiker', 
  'Klipspringer', 'Hyena', 'Jackal', 'Baboon'
];

const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", 
  "Limpopo", "Mpumalanga", "Northern Cape", "North West", 
  "Western Cape", "Flexible / Outfitter's Choice"
];

export default function CustomQuoteModal({ isOpen, onClose, outfitterId, outfitterName, bookedDates = [] }: CustomQuoteModalProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [province, setProvince] = useState("");
  
  const [days, setDays] = useState(7);
  const [hunters, setHunters] = useState(1);
  const [observers, setObservers] = useState(0);
  const [targetSpecies, setTargetSpecies] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [dateConflict, setDateConflict] = useState(false);

  // NEW: Check for overlapping bookings whenever dates change
  useEffect(() => {
    setDateConflict(false);
    setError("");

    if (startDate && endDate && bookedDates.length > 0) {
      const selectedStart = new Date(startDate);
      const selectedEnd = new Date(endDate);

      // Normalize time to midnight for accurate day comparison
      selectedStart.setHours(0,0,0,0);
      selectedEnd.setHours(23,59,59,999);

      const hasConflict = bookedDates.some(booking => {
        const bStart = new Date(booking.start);
        const bEnd = new Date(booking.end);
        
        bStart.setHours(0,0,0,0);
        bEnd.setHours(23,59,59,999);

        // Check if selected range overlaps with booking range
        return (selectedStart <= bEnd && selectedEnd >= bStart);
      });

      if (hasConflict) {
        setDateConflict(true);
        setError("The dates you selected overlap with an existing booking. Please select different dates.");
      }

      // Calculate days difference
      const diffTime = selectedEnd.getTime() - selectedStart.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        setDays(diffDays);
      }
    }
  }, [startDate, endDate, bookedDates]);

  if (!isOpen) return null;

  const handleToggleSpecies = (species: string) => {
    setTargetSpecies(prev => 
      prev.includes(species) 
        ? prev.filter(s => s !== species) 
        : [...prev, species]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!startDate || !endDate) {
      setError("Please select your preferred arrival and departure dates.");
      return;
    }

    if (dateConflict) {
      setError("Cannot submit request. Your dates conflict with an existing booking.");
      return;
    }

    if (!province) {
      setError("Please select a target province.");
      return;
    }

    if (targetSpecies.length === 0) {
      setError("Please select at least one primary target species.");
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Please log in or create a free Hunter account to request quotes.");
      }

      const requestsRef = collection(db, "quote_requests");
      await addDoc(requestsRef, {
        outfitterId,
        outfitterName,
        hunterId: currentUser.uid,
        hunterName: currentUser.displayName || "Registered Hunter",
        hunterEmail: currentUser.email,
        status: "PENDING_OUTFITTER_REVIEW",
        logistics: { 
          startDate, 
          endDate, 
          province, 
          days, 
          hunters, 
          observers 
        },
        targetSpecies, 
        message,
        createdAt: serverTimestamp(),
      });

      setIsSuccess(true);
      
      setTimeout(() => {
        setIsSuccess(false);
        setTargetSpecies([]); 
        setStartDate("");
        setEndDate("");
        setProvince("");
        onClose();
      }, 3000);

    } catch (err: any) {
      setError(err.message || "Failed to send quote request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-kalahari/20 relative flex flex-col max-h-[90vh]">
        
        <div className="bg-olive p-6 text-white shrink-0 relative shadow-sm z-10">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-black font-headline text-kalahari mb-1">Bespoke Safari Quote</h2>
          <p className="text-sm text-off-white/80 font-medium">Requesting from {outfitterName}</p>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {isSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
              </div>
              <h3 className="text-2xl font-black text-olive dark:text-off-white mb-2">Request Sent!</h3>
              <p className="text-olive/70 dark:text-off-white/70 font-medium">
                The outfitter has received your requirements. They will check their calendar and generate your custom pricing matrix shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3 rounded-lg animate-in slide-in-from-top-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-800 dark:text-red-400 text-sm font-bold leading-relaxed">{error}</p>
                </div>
              )}

              <div className={`bg-gray-50 dark:bg-stone-800/50 rounded-xl p-4 border transition-colors ${dateConflict ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-kalahari/10'} space-y-4`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase mb-2 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-kalahari" /> Arrival Date</label>
                    <input 
                      type="date" 
                      required
                      min={new Date().toISOString().split('T')[0]} 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)} 
                      className={`w-full bg-white dark:bg-stone-900 border ${dateConflict ? 'border-red-500 text-red-600 dark:text-red-400 focus:ring-red-500' : 'border-kalahari/20 text-olive dark:text-white focus:ring-kalahari'} rounded-xl p-3 outline-none focus:ring-2 font-bold text-sm transition-colors`} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase mb-2 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-kalahari" /> Departure Date</label>
                    <input 
                      type="date" 
                      required
                      min={startDate || new Date().toISOString().split('T')[0]} 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)} 
                      className={`w-full bg-white dark:bg-stone-900 border ${dateConflict ? 'border-red-500 text-red-600 dark:text-red-400 focus:ring-red-500' : 'border-kalahari/20 text-olive dark:text-white focus:ring-kalahari'} rounded-xl p-3 outline-none focus:ring-2 font-bold text-sm transition-colors`} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase mb-2 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-kalahari" /> Hunting Province</label>
                  <select 
                    required
                    value={province} 
                    onChange={(e) => setProvince(e.target.value)} 
                    className="w-full bg-white dark:bg-stone-900 border border-kalahari/20 rounded-xl p-3 text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari font-bold text-sm"
                  >
                    <option value="" disabled>Select a target province...</option>
                    {PROVINCES.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase mb-2 flex items-center gap-1.5">Days</label>
                  <input type="number" min="1" value={days} onChange={(e) => setDays(parseInt(e.target.value) || 1)} className="w-full bg-off-white dark:bg-stone-800 border border-kalahari/20 rounded-xl p-3 text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari font-bold text-center" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase mb-2 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Hunters</label>
                  <input type="number" min="1" value={hunters} onChange={(e) => setHunters(parseInt(e.target.value) || 1)} className="w-full bg-off-white dark:bg-stone-800 border border-kalahari/20 rounded-xl p-3 text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari font-bold text-center" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase mb-2 flex items-center gap-1.5"><Users className="h-3.5 w-3.5 opacity-50" /> Observers</label>
                  <input type="number" min="0" value={observers} onChange={(e) => setObservers(parseInt(e.target.value) || 0)} className="w-full bg-off-white dark:bg-stone-800 border border-kalahari/20 rounded-xl p-3 text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari font-bold text-center" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase mb-3 flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Primary Target Species</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-off-white dark:bg-stone-800/50 border border-kalahari/20 rounded-xl p-4">
                  {MASTER_SPECIES_LIST.map((species) => (
                    <label key={species} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={targetSpecies.includes(species)}
                        onChange={() => handleToggleSpecies(species)}
                        className="w-4 h-4 text-orange-600 rounded border-kalahari/30 focus:ring-orange-500 bg-white dark:bg-stone-900 shrink-0"
                      />
                      <span className="text-sm font-medium text-olive dark:text-white group-hover:text-orange-600 transition-colors line-clamp-1">
                        {species}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase mb-2">Additional Notes / Requests</label>
                <textarea 
                  placeholder="Any special dietary requirements, specific trophy sizes, or questions for the outfitter?" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  className="w-full h-24 bg-off-white dark:bg-stone-800 border border-kalahari/20 rounded-xl p-3 text-olive dark:text-white outline-none focus:ring-2 focus:ring-kalahari font-medium resize-none custom-scrollbar" 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || targetSpecies.length === 0 || dateConflict}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? "Sending Request..." : <><Send className="h-5 w-5" /> Request Custom Quote</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}