"use client";

import * as React from "react";
import { X } from "lucide-react";

const SheetContext = React.createContext<any>(null);

export const Sheet = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  return <SheetContext.Provider value={{ open, setOpen }}>{children}</SheetContext.Provider>;
};

export const SheetTrigger = React.forwardRef<HTMLButtonElement, any>(
  ({ asChild, children, ...props }, ref) => {
    const { setOpen } = React.useContext(SheetContext);
    return (
      <div onClick={() => setOpen(true)} className="inline-block cursor-pointer" {...props}>
        {children}
      </div>
    );
  }
);
SheetTrigger.displayName = "SheetTrigger";

export const SheetContent = React.forwardRef<HTMLDivElement, any>(
  ({ children, side = "left", className, ...props }, ref) => {
    const { open, setOpen } = React.useContext(SheetContext);
    
    if (!open) return null;
    
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" 
          onClick={() => setOpen(false)} 
        />
        {/* Sidebar Panel */}
        <div 
          ref={ref} 
          className={`fixed z-50 bg-white p-6 shadow-lg inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm flex flex-col ${className || ""}`} 
          {...props}
        >
          {children}
          <button onClick={() => setOpen(false)} className="absolute right-4 top-4 p-2 opacity-70 hover:opacity-100">
            <X className="h-5 w-5 text-stone-900" />
          </button>
        </div>
      </>
    );
  }
);
SheetContent.displayName = "SheetContent";