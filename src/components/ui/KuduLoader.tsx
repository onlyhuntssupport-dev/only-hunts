"use client";

import React from "react";

export default function KuduLoader() {
  return (
    <div className="fixed inset-0 bg-off-white/95 dark:bg-olive/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center transition-colors duration-300">
      
      {/* --- CUSTOM ANIMATIONS --- */}
      <style>{`
        @keyframes driveRoad {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 25; }
        }
        @keyframes bounceBody {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.5px); }
        }
        @keyframes dustPuff {
          0% { transform: translate(0, 0) scale(0.5); opacity: 0.8; }
          100% { transform: translate(-35px, -8px) scale(3.5); opacity: 0; }
        }
        .animate-road { animation: driveRoad 0.4s linear infinite; }
        .animate-body { animation: bounceBody 0.3s ease-in-out infinite; }
        .dust-1 { animation: dustPuff 0.6s ease-out infinite; }
        .dust-2 { animation: dustPuff 0.6s ease-out infinite 0.2s; }
        .dust-3 { animation: dustPuff 0.6s ease-out infinite 0.4s; }
      `}</style>

      {/* --- REALISTIC 79 SERIES DOUBLE CAB ANIMATION --- */}
      <div className="relative w-56 h-36 text-kalahari">
        <svg viewBox="0 0 120 80" className="w-full h-full overflow-visible">
          
          {/* Moving Road */}
          <line 
            x1="-20" y1="63" x2="140" y2="63" 
            stroke="currentColor" strokeWidth="2" strokeDasharray="15 10" 
            className="animate-road" opacity="0.4" 
          />

          {/* Dust Clouds (Kicking out from big rear mud terrains) */}
          <g className="text-kalahari/80">
            <circle cx="10" cy="55" r="4.5" fill="currentColor" className="dust-1 origin-center" />
            <circle cx="10" cy="55" r="4.5" fill="currentColor" className="dust-2 origin-center" />
            <circle cx="10" cy="55" r="4.5" fill="currentColor" className="dust-3 origin-center" />
          </g>

          {/* Bouncing Cruiser Body & Details */}
          <g className="animate-body">
            
            {/* Hunting Rails (Tralies) */}
            <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
              <path d="M 4 15 L 33 15" /> {/* Top Rail */}
              <path d="M 4 21 L 33 21" /> {/* Mid Rail 1 */}
              <path d="M 4 27 L 33 27" /> {/* Mid Rail 2 */}
              <path d="M 4 15 L 4 32" />  {/* Back Post */}
              <path d="M 14 15 L 14 32" /> {/* Vertical Post */}
              <path d="M 24 15 L 24 32" /> {/* Vertical Post */}
              <path d="M 4 15 L 14 32" />  {/* Diagonal Brace */}
            </g>

            {/* Rear Tow Hitch / Bumper */}
            <path d="M 4 50 L 1 50 L 1 46" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />

            {/* Snorkel */}
            <path d="M 76 29 L 69 11 L 73 11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M 68 11 L 74 11 L 74 14 L 68 14 Z" fill="currentColor" /> {/* Snorkel Head */}

            {/* Main Body Path */}
            {/* Note: I removed the static fill="#f8f9fa" so we can use Tailwind classes for the fill */}
            <path
              className="fill-off-white dark:fill-olive stroke-kalahari"
              d="M 4 32
                 L 33 32
                 L 33 16
                 Q 35 13, 42 13
                 L 58 13
                 L 74 28
                 Q 88 29, 96 31
                 L 100 33
                 L 99 47
                 L 98 50
                 A 13 13 0 0 0 72 50
                 L 38 50
                 A 13 13 0 0 0 12 50
                 L 4 50
                 Z"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            
            {/* Windows (Proper Double Cab Cut) */}
            {/* Adjusted opacity and fill for dark mode compatibility */}
            <g className="fill-olive dark:fill-kalahari opacity-15 dark:opacity-20 transition-colors">
              <path d="M 36 30 L 36 16 Q 40 15, 45 15 L 52 15 L 52 30 Z" /> {/* Rear Window */}
              <path d="M 55 30 L 55 15 L 60 15 L 71 30 Z" /> {/* Front Window */}
            </g>

            {/* Door Seam Lines & Pillars */}
            <g stroke="currentColor" strokeWidth="1" opacity="0.4">
              <path d="M 53.5 15 L 53.5 50" /> {/* B-Pillar */}
              <path d="M 34.5 16 L 34.5 50" /> {/* Back of Cab */}
              <path d="M 74 29 L 74 50" /> {/* Front Door Line */}
            </g>

            {/* Door Handles */}
            <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M 41 33 L 45 33" />
              <path d="M 60 33 L 64 33" />
            </g>

            {/* Front Bullbar */}
            <path d="M 99 48 L 105 48 L 105 37 L 99 37" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M 105 43 L 99 43" stroke="currentColor" strokeWidth="2" />

            {/* Side Step / Rock Slider */}
            <path d="M 38 52 L 72 52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Spinning Mud Terrain Wheels */}
          <g className="text-olive dark:text-off-white dark:text-off-white transition-colors">
            {/* Rear Wheel (cx=25, cy=50) */}
            <g style={{ transformOrigin: '25px 50px' }} className="animate-[spin_0.5s_linear_infinite]">
              <circle cx="25" cy="50" r="10.5" fill="none" stroke="currentColor" strokeWidth="4.5" strokeDasharray="6 3" />
              <circle cx="25" cy="50" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="25" cy="50" r="2.5" fill="currentColor" />
            </g>
            
            {/* Front Wheel (cx=85, cy=50) */}
            <g style={{ transformOrigin: '85px 50px' }} className="animate-[spin_0.5s_linear_infinite]">
              <circle cx="85" cy="50" r="10.5" fill="none" stroke="currentColor" strokeWidth="4.5" strokeDasharray="6 3" />
              <circle cx="85" cy="50" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="85" cy="50" r="2.5" fill="currentColor" />
            </g>
          </g>
        </svg>
      </div>

      {/* --- TEXT --- */}
      <h3 className="mt-4 text-olive dark:text-off-white dark:text-kalahari font-black font-headline tracking-widest text-xl animate-pulse uppercase transition-colors">
        Hunt Inbound
      </h3>
      <p className="text-olive dark:text-off-white/50 dark:text-off-white/50 text-[10px] font-bold tracking-[0.2em] uppercase mt-2 transition-colors">
        Securing Basecamp...
      </p>
    </div>
  );
}