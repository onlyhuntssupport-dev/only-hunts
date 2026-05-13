"use client";

import { FileText, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FocusEditorDrawerProps {
  activeDrawer: "bio" | "policies" | null;
  content: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onClose: () => void;
}

export default function FocusEditorDrawer({ activeDrawer, content, onChange, onClose }: FocusEditorDrawerProps) {
  if (!activeDrawer) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full md:w-[600px] h-full bg-stone-950 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-kalahari/20 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h3 className="text-xl font-black font-headline text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-kalahari" />
            {activeDrawer === "bio" ? "Draft Company Bio" : "Draft Legal Policies"}
          </h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 p-6 flex flex-col bg-stone-900/50">
          <textarea 
            name={activeDrawer}
            value={content}
            onChange={onChange}
            className="flex-1 w-full bg-black/40 border border-kalahari/20 text-white focus:outline-none focus:border-kalahari focus:ring-1 focus:ring-kalahari font-medium text-base rounded-2xl p-6 shadow-inner resize-none custom-scrollbar leading-relaxed"
            autoFocus
          />
        </div>
        <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose} className="border-kalahari/30 text-white hover:bg-kalahari/10 font-bold">Close Editor</Button>
          <Button type="button" onClick={onClose} className="bg-kalahari hover:bg-kalahari/90 text-olive font-black"><CheckCircle2 className="h-4 w-4 mr-2" /> Done Drafting</Button>
        </div>
      </div>
    </div>
  );
}