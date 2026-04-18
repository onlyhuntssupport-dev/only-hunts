import { Calendar, ChevronRight, Target, Users, MapPin, Archive, FileText } from "lucide-react";
import { UnifiedQuote } from "@/types/quotes";

interface QuoteListProps {
  quotes: UnifiedQuote[];
  selectedQuote: UnifiedQuote | null;
  activeTab: string;
  onSelect: (quote: UnifiedQuote) => void;
}

export default function QuoteList({ quotes, selectedQuote, activeTab, onSelect }: QuoteListProps) {
  if (quotes.length === 0) {
    return (
      <div className="text-center py-12 bg-white/50 dark:bg-stone-900/50 rounded-2xl border-2 border-dashed border-kalahari/20">
        {activeTab === 'archived' ? <Archive className="h-10 w-10 text-kalahari/30 mx-auto mb-3" /> : <FileText className="h-10 w-10 text-kalahari/30 mx-auto mb-3" />}
        <p className="text-sm font-bold text-olive/50 dark:text-off-white/40">No quotes in this folder</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pr-2">
      {quotes.map((q) => (
        <button
          key={q.id}
          onClick={() => onSelect(q)}
          className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
            selectedQuote?.id === q.id 
              ? "bg-white dark:bg-stone-900 border-kalahari shadow-md scale-[1.02]" 
              : "bg-white/50 dark:bg-stone-900/50 border-kalahari/10 hover:border-kalahari/30"
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className={`font-black text-base line-clamp-1 pr-4 ${!q.outfitterRead && activeTab === 'pending' ? 'text-orange-500 dark:text-orange-400' : 'text-olive dark:text-off-white'}`}>
              {q.hunterName || "Registered Hunter"}
            </h3>
            {selectedQuote?.id === q.id && <ChevronRight className="h-5 w-5 text-kalahari shrink-0" />}
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-olive/60 dark:text-off-white/50 uppercase tracking-widest mb-3 flex-wrap">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-kalahari" /> {q.logistics?.days || '?'} Days</span>
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-kalahari" /> {q.logistics?.hunters || '?'} Hunters</span>
            {q.logistics?.province && (
              <span className="flex items-center gap-1 w-full mt-1 text-kalahari/80"><MapPin className="h-3 w-3" /> {q.logistics.province}</span>
            )}
          </div>
          <p className="text-xs font-medium text-olive/80 dark:text-off-white/70 line-clamp-1 border-t border-kalahari/10 pt-2">
            <Target className="h-3 w-3 inline mr-1 text-kalahari" />
            {Array.isArray(q.targetSpecies) ? q.targetSpecies.join(", ") : q.targetSpecies}
          </p>
        </button>
      ))}
    </div>
  );
}