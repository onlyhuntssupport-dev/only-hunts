"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Calendar } from "lucide-react";

interface Logistics {
  startDate?: string;
  endDate?: string;
  days?: number;
  hunters?: number;
}

interface UnifiedQuote {
  id: string;
  status: string;
  hunterName?: string;
  outfitterArchived?: boolean;
  logistics?: Logistics;
}

interface BookedCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotes: UnifiedQuote[]; // All quotes to extract booked dates
  currentQuote: UnifiedQuote | null; // The specific quote being viewed
}

export default function BookedCalendarModal({ isOpen, onClose, quotes, currentQuote }: BookedCalendarModalProps) {
  // Default to the start date of the current quote, or today
  const initialDate = currentQuote?.logistics?.startDate 
    ? new Date(currentQuote.logistics.startDate) 
    : new Date();
    
  const [currentDate, setCurrentDate] = useState(initialDate);

  // Reset calendar view when opening a different quote
  useEffect(() => {
    if (isOpen && currentQuote?.logistics?.startDate) {
      setCurrentDate(new Date(currentQuote.logistics.startDate));
    }
  }, [isOpen, currentQuote]);

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // 1. Map existing accepted bookings (Green)
  const bookedRanges = quotes
    .filter(q => q.status === 'ACCEPTED' && q.logistics?.startDate && q.logistics?.endDate && !q.outfitterArchived && q.id !== currentQuote?.id)
    .map(q => ({
       start: new Date(q.logistics!.startDate!),
       end: new Date(q.logistics!.endDate!),
       hunter: q.hunterName
    }));

  // 2. Map the current quote's requested dates (Orange)
  const pendingRange = currentQuote?.logistics?.startDate && currentQuote?.logistics?.endDate ? {
    start: new Date(currentQuote.logistics.startDate),
    end: new Date(currentQuote.logistics.endDate),
  } : null;

  const getDayStatus = (day: number) => {
     const date = new Date(year, month, day);
     date.setHours(12,0,0,0); 

     let status = { isBooked: false, isPending: false, hunter: "" };

     // Check if it falls in the currently viewed quote's requested dates
     if (pendingRange) {
        const pStart = new Date(pendingRange.start); pStart.setHours(0,0,0,0);
        const pEnd = new Date(pendingRange.end); pEnd.setHours(23,59,59,999);
        if (date >= pStart && date <= pEnd) status.isPending = true;
     }

     // Check if it falls in an already accepted booking
     const booking = bookedRanges.find(r => {
         const s = new Date(r.start); s.setHours(0,0,0,0);
         const e = new Date(r.end); e.setHours(23,59,59,999);
         return date >= s && date <= e;
     });

     if (booking) {
       status.isBooked = true;
       status.hunter = booking.hunter || "Hunter";
     }

     return status;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 border border-kalahari/20 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        
        <div className="flex justify-between items-center p-5 border-b border-kalahari/10 bg-off-white dark:bg-stone-950">
          <h3 className="font-black text-lg text-olive dark:text-off-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-kalahari"/> Availability Check
          </h3>
          <button onClick={onClose} className="p-2 text-olive/50 hover:text-red-500 transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
           <div className="flex justify-between items-center mb-6">
              <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 bg-kalahari/10 hover:bg-kalahari/20 rounded-lg transition-colors">
                <ChevronLeft className="h-5 w-5 text-olive dark:text-off-white"/>
              </button>
              <span className="font-black text-lg text-center text-olive dark:text-white uppercase tracking-widest">{monthNames[month]} {year}</span>
              <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 bg-kalahari/10 hover:bg-kalahari/20 rounded-lg transition-colors">
                <ChevronRight className="h-5 w-5 text-olive dark:text-off-white"/>
              </button>
           </div>
           
           <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-black uppercase text-olive/50 dark:text-off-white/40 tracking-widest">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
           </div>
           
           <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                 const day = i + 1;
                 const status = getDayStatus(day);
                 
                 let baseClass = "aspect-square rounded-xl flex flex-col items-center justify-center relative border transition-all ";
                 
                 if (status.isBooked && status.isPending) {
                   baseClass += "bg-red-500/20 border-red-500 text-red-700 dark:text-red-400 font-black shadow-inner animate-pulse"; // Conflict!
                 } else if (status.isBooked) {
                   baseClass += "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 font-bold shadow-inner"; // Accepted
                 } else if (status.isPending) {
                   baseClass += "bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-400 font-black shadow-inner scale-105 z-10"; // Currently viewed quote
                 } else {
                   baseClass += "border-transparent text-olive/70 dark:text-off-white/70 hover:border-kalahari/30 hover:bg-black/5 dark:hover:bg-white/5"; // Open
                 }

                 return (
                    <div 
                      key={day} 
                      title={status.isBooked && status.isPending ? `CONFLICT with ${status.hunter}` : status.isBooked ? `Booked: ${status.hunter}` : status.isPending ? "Requested Dates" : ""}
                      className={baseClass}
                    >
                       <span className="text-sm">{day}</span>
                       {status.isBooked && !status.isPending && <div className="absolute bottom-1 w-1 h-1 bg-green-500 rounded-full"></div>}
                       {status.isBooked && status.isPending && <X className="absolute inset-0 m-auto h-6 w-6 text-red-500 opacity-50" />}
                    </div>
                 )
              })}
           </div>

           <div className="mt-6 flex flex-wrap justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-olive/60 dark:text-off-white/60">
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500/50"></div> Current Request</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500/10 border border-green-500/30"></div> Booked</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500/20 border border-red-500"></div> Conflict</span>
           </div>
        </div>
      </div>
    </div>
  );
}