import { ShieldCheck, Leaf, Target, Eye } from "lucide-react";

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-white pb-24 font-sans selection:bg-kalahari selection:text-stone-950">
      
      {/* Hero Section */}
      <div className="relative h-[65vh] flex items-center justify-center overflow-hidden border-b border-stone-800">
        {/* Added brightness-[1.2] to increase brightness by exactly 20% */}
        <div className="absolute inset-0 bg-[url('/custodians-bg.jpg')] bg-cover bg-fixed bg-center opacity-30 brightness-[1.2]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/80"></div>
        
        <div className="relative z-10 text-center px-6 mt-12">
          <p className="text-kalahari font-black uppercase tracking-[0.3em] text-sm mb-4">The Custodians</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 drop-shadow-lg">
            HONOUR THE <span className="text-stone-100">TRADITION.</span>
          </h1>
          <p className="text-xl md:text-2xl font-bold text-stone-400 max-w-2xl mx-auto uppercase tracking-widest">
            Ancient Pursuit. Modern Precision.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-16 relative z-20">
        <div className="bg-stone-900/90 backdrop-blur-xl border border-stone-800 p-8 md:p-16 rounded-3xl shadow-2xl">
          <div className="space-y-16">
            
            {/* The Values Section */}
            <section className="text-center max-w-3xl mx-auto">
              <Eye className="h-8 w-8 text-kalahari mx-auto mb-6 opacity-80" />
              <p className="text-2xl md:text-4xl font-black leading-tight text-white mb-6">
                We believe the future of the African wilderness depends on the values of the ethical hunter.
              </p>
              <p className="text-lg text-stone-400 font-medium leading-relaxed">
                We are hunters, outfitters, and conservationists bound by a shared history. Our roots in the African veld echo the era of early explorers like Selous and Livingstone—a time when the hunter was the first true custodian of the wild. This pursuit is not merely a sport; it is a profound, generational commitment to protecting the land. Only-Hunts was built to honor and preserve that heritage. We provide the digital precision that gets out of the way, allowing true professionals to manage their soil and hunters to step into the wild with absolute clarity and respect.
              </p>
            </section>

            <div className="h-px bg-gradient-to-r from-stone-900 via-stone-700 to-stone-900 w-full"></div>

            {/* The Three Pillars */}
            <section>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-white tracking-tight">The Three Pillars of Custodianship</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="p-8 bg-stone-950 rounded-2xl border border-stone-800 relative overflow-hidden group hover:border-kalahari/50 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-kalahari/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                  <Target className="h-10 w-10 text-kalahari mb-6 relative z-10" />
                  <h4 className="font-black text-xl text-white mb-3 relative z-10">The Hunter</h4>
                  <p className="text-sm text-stone-400 leading-relaxed font-medium relative z-10">
                    Providing absolute clarity. You book with confidence, knowing every outfitter is verified to the highest ethical and professional standards.
                  </p>
                </div>

                <div className="p-8 bg-stone-950 rounded-2xl border border-stone-800 relative overflow-hidden group hover:border-kalahari/50 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-kalahari/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                  <ShieldCheck className="h-10 w-10 text-kalahari mb-6 relative z-10" />
                  <h4 className="font-black text-xl text-white mb-3 relative z-10">The Outfitter</h4>
                  <p className="text-sm text-stone-400 leading-relaxed font-medium relative z-10">
                    Equipping professionals with precision tools. We streamline the business of the hunt, allowing operators to focus on the game and the client.
                  </p>
                </div>

                <div className="p-8 bg-stone-950 rounded-2xl border border-stone-800 relative overflow-hidden group hover:border-kalahari/50 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-kalahari/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                  <Leaf className="h-10 w-10 text-kalahari mb-6 relative z-10" />
                  <h4 className="font-black text-xl text-white mb-3 relative z-10">The Wildlife</h4>
                  <p className="text-sm text-stone-400 leading-relaxed font-medium relative z-10">
                    Ensuring sustainable use. A platform built to keep the economic value of the hunt rooted firmly in habitat conservation and anti-poaching efforts.
                  </p>
                </div>

              </div>
            </section>

            {/* Conservation Impact */}
            <section className="bg-stone-950 border border-stone-800 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('/pattern.svg')]"></div>
              <div className="relative z-10 max-w-2xl mx-auto">
                <h3 className="text-2xl font-black text-white mb-4">A Direct Investment in the Soil</h3>
                <p className="text-stone-400 font-medium leading-relaxed mb-0">
                  "If it pays, it stays." By facilitating direct connections between hunters and verified outfitters, Only-Hunts ensures that maximum capital remains exactly where it belongs: on the farm. Better margins for operators mean better resources for wildlife management and habitat preservation.
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}