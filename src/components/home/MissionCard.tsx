import { ShieldCheck, Leaf, Target, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function MissionCard() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-stone-950">
      <div className="max-w-7xl mx-auto relative overflow-hidden rounded-[2rem] border border-stone-800 shadow-2xl group">
        
        {/* Added brightness-[1.2] to match the manifesto page */}
        <div className="absolute inset-0 bg-[url('/custodians-bg.jpg')] bg-cover bg-center opacity-40 mix-blend-lighten transition-transform duration-1000 group-hover:scale-105 brightness-[1.2]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-stone-950/40"></div>
        <div className="absolute inset-0 backdrop-blur-[2px]"></div>

        <div className="relative z-10 p-8 sm:p-12 lg:p-16 lg:flex lg:items-center lg:justify-between gap-12">
          
          {/* Left Content: The Slogan & Pitch */}
          <div className="lg:w-1/2 mb-12 lg:mb-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900/80 border border-stone-700/50 mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-kalahari animate-pulse"></span>
              <p className="text-stone-300 font-bold uppercase tracking-widest text-[10px]">The Custodians</p>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1] mb-6 drop-shadow-lg">
              Ancient Pursuit.<br/>Modern Precision.
            </h2>
            
            <p className="text-stone-300 font-medium leading-relaxed mb-8 max-w-lg text-sm sm:text-base">
              We believe the future of the African wilderness depends on the values of the ethical hunter. Only-Hunts provides the technology that gets out of the way, allowing professional outfitters to manage their land and hunters to experience the wild with absolute clarity.
            </p>
            
            <Link href="/mission" className="inline-flex items-center gap-2 text-kalahari font-bold hover:text-white transition-colors">
              Read the Full Manifesto <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Right Content: The Three Pillars */}
          <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-stone-900/60 border border-stone-700/50 p-6 rounded-2xl backdrop-blur-md hover:border-kalahari/40 transition-colors">
              <Target className="h-7 w-7 text-kalahari mb-4" />
              <h3 className="text-white font-black text-sm mb-2">The Hunter</h3>
              <p className="text-xs text-stone-400 font-medium leading-relaxed">
                Absolute clarity and verified ethical standards.
              </p>
            </div>

            <div className="bg-stone-900/60 border border-stone-700/50 p-6 rounded-2xl backdrop-blur-md hover:border-kalahari/40 transition-colors mt-0 sm:mt-6">
              <ShieldCheck className="h-7 w-7 text-kalahari mb-4" />
              <h3 className="text-white font-black text-sm mb-2">The Outfitter</h3>
              <p className="text-xs text-stone-400 font-medium leading-relaxed">
                Precision tools to streamline the business of the hunt.
              </p>
            </div>

            <div className="bg-stone-900/60 border border-stone-700/50 p-6 rounded-2xl backdrop-blur-md hover:border-kalahari/40 transition-colors mt-0 sm:mt-12">
              <Leaf className="h-7 w-7 text-kalahari mb-4" />
              <h3 className="text-white font-black text-sm mb-2">The Wildlife</h3>
              <p className="text-xs text-stone-400 font-medium leading-relaxed">
                Economic value rooted strictly in habitat conservation.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
