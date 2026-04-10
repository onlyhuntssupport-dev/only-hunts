"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface BookedRange {
  start: Date;
  end: Date;
  label?: string;
}

interface GlobalBookingCalendarProps {
  bookedRanges: BookedRange[];
}

export default function GlobalBookingCalendar({ bookedRanges }: GlobalBookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getDayStatus = (day: number) => {
     const date = new Date(year, month, day);
     date.setHours(12,0,0,0); // Avoid timezone boundary issues

     const booking = bookedRanges.find(r => {
         const s = new Date(r.start); s.setHours(0,0,0,0);
         const e = new Date(r.end); e.setHours(23,59,59,999);
         return date >= s && date <= e;
     });

     return booking ? { isBooked: true, label: booking.label } : { isBooked: false };
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-kalahari/20 rounded-3xl p-6 shadow-sm h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-lg text-olive dark:text-off-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-kalahari"/> Master Availability
          </h3>
          <div className="flex items-center gap-3">
             <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1.5 bg-kalahari/10 hover:bg-kalahari/20 rounded-lg transition-colors">
               <ChevronLeft className="h-4 w-4 text-olive dark:text-off-white"/>
             </button>
             <span className="font-black text-sm uppercase tracking-widest min-w-[110px] text-center text-olive dark:text-white">
               {monthNames[month]} {year}
             </span>
             <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1.5 bg-kalahari/10 hover:bg-kalahari/20 rounded-lg transition-colors">
               <ChevronRight className="h-4 w-4 text-olive dark:text-off-white"/>
             </button>
          </div>
       </div>
       
       <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-black uppercase text-olive/50 dark:text-off-white/40 tracking-widest">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
       </div>
       
       <div className="grid grid-cols-7 gap-2 flex-grow auto-rows-fr">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
             const day = i + 1;
             const { isBooked, label } = getDayStatus(day);
             
             return (
                <div 
                  key={day} 
                  title={isBooked ? `Booked: ${label}` : 'Available'}
                  className={`rounded-xl flex flex-col items-center justify-center relative border transition-all min-h-[3rem] ${
                    isBooked 
                      ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 font-bold shadow-inner cursor-not-allowed' 
                      : 'border-transparent text-olive/70 dark:text-off-white/70 hover:border-kalahari/30 hover:bg-black/5 dark:hover:bg-white/5 cursor-default'
                  }`}
                >
                   <span className="text-sm">{day}</span>
                   {isBooked && <div className="absolute bottom-1.5 w-1 h-1 bg-green-500 rounded-full"></div>}
                </div>
             )
          })}
       </div>
       
       <div className="mt-4 pt-4 border-t border-kalahari/10 flex justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-olive/60 dark:text-off-white/50">
          <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-transparent border border-kalahari/30"></div> Open</span>
          <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-green-500/10 border border-green-500/30"></div> Locked</span>
       </div>
    </div>
  );
}