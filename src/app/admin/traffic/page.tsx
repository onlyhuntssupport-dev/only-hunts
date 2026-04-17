"use client";

import Link from "next/link";
import { ArrowLeft, Activity } from "lucide-react";
import TrafficWidget from "@/components/admin/TrafficWidget";

export default function TrafficPage() {
  return (
    <div className="p-4 sm:p-8 flex-1 flex flex-col h-full overflow-y-auto w-full">
      
      {/* HEADER & NAVIGATION */}
      <div className="mb-8">
        <Link 
          href="/admin" 
          className="inline-flex items-center text-olive/60 hover:text-olive dark:text-off-white/60 dark:hover:text-off-white font-bold text-sm transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-kalahari rounded-2xl flex items-center justify-center text-white shadow-lg shadow-kalahari/20">
            <Activity className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-olive dark:text-off-white uppercase tracking-tight">Platform Traffic</h1>
            <p className="text-sm font-bold text-olive/50 dark:text-off-white/50">7-Day Visitor Analytics</p>
          </div>
        </div>
      </div>

      {/* WIDGET CONTAINER */}
      <div className="flex-1">
        <TrafficWidget />
      </div>
      
    </div>
  );
}