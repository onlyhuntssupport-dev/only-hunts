import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Target, Globe, ArrowRight, CheckCircle2, Compass } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Only-Hunts",
  description: "Learn about Only-Hunts, the premier marketplace for verified South African hunting outfitters.",
};

export default function AboutPage() {
  return (
    <div className="bg-olive min-h-screen pt-24 pb-24 text-off-white font-body">
      
      {/* --- HERO SECTION --- */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 md:mb-32">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-5 pointer-events-none"></div>
        <div className="relative z-10 text-center max-w-4xl mx-auto pt-12 md:pt-20">
          <div className="inline-flex items-center gap-2 bg-kalahari/10 border border-kalahari/30 text-kalahari px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6">
            <Compass className="h-4 w-4" /> Our Story
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-headline tracking-tighter mb-6 uppercase leading-tight">
            Redefining the <span className="text-kalahari">Safari</span> Experience
          </h1>
          <p className="text-lg md:text-xl text-off-white/80 font-medium leading-relaxed max-w-2xl mx-auto">
            Only-Hunts was built to bridge the gap between world-class South African outfitters and passionate hunters across the globe. Direct connections, transparent pricing, and unforgettable adventures in the bushveld.
          </p>
        </div>
      </section>

      {/* --- THE MISSION (SPLIT LAYOUT) --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 md:mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
          
          {/* Left: Image */}
          <div className="relative h-[400px] md:h-[600px] w-full rounded-3xl overflow-hidden border-4 border-black/40 shadow-2xl group">
            <div className="absolute inset-0 bg-kalahari/20 group-hover:bg-transparent transition-colors duration-700 z-10 pointer-events-none"></div>
            
            {/* The Integrated Kudu Hero Image */}
            <div 
              className="absolute inset-0 bg-cover bg-[position:60%_center] md:bg-center transition-transform duration-1000 group-hover:scale-105"
              style={{ backgroundImage: "url('/about-kudu.png')" }}
            ></div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-0"></div>
            
            <div className="absolute bottom-0 left-0 p-8 z-20">
              <div className="bg-black/50 backdrop-blur-md border border-kalahari/30 p-4 rounded-xl inline-block">
                <Image src="/logo-transparent.png" alt="Only-Hunts Logo" width={80} height={80} className="drop-shadow-lg" />
              </div>
            </div>
          </div>

          {/* Right: The Problem & Solution (DIPLOMATIC UPDATE) */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-black font-headline text-white mb-4">Evolving the Industry.</h2>
              <p className="text-off-white/70 font-medium leading-relaxed">
                Historically, planning an international hunting trip involved complex logistics and multiple intermediaries, which often created a disconnect between the hunter and the outfitter. As the digital landscape has evolved, we saw an opportunity to streamline this journey, helping incredible local outfitters reach a global audience more efficiently.
              </p>
            </div>
            
            <div>
              <h2 className="text-3xl md:text-4xl font-black font-headline text-kalahari mb-4">A Modern Approach.</h2>
              <p className="text-off-white/70 font-medium leading-relaxed">
                Only-Hunts is a strictly vetted, premium marketplace designed for the modern sportsman. We empower hunters to browse live packages, compare options, and message verified outfitters directly. We provide the technology that puts control in the hands of the hunters and the professionals who guide them.
              </p>
            </div>

            <ul className="space-y-4 pt-4">
              <li className="flex items-start">
                <CheckCircle2 className="h-6 w-6 text-kalahari mr-3 shrink-0" />
                <span className="text-off-white/90 font-bold">Direct Communication with Outfitters</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-6 w-6 text-kalahari mr-3 shrink-0" />
                <span className="text-off-white/90 font-bold">100% Transparent Package Pricing</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-6 w-6 text-kalahari mr-3 shrink-0" />
                <span className="text-off-white/90 font-bold">Strictly Vetted & Verified Professionals</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* --- DUAL AUDIENCE VALUE PROP --- */}
      <section className="bg-black/40 border-y border-kalahari/20 py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black font-headline text-white mb-4">Built for the <span className="text-kalahari">Industry</span></h2>
            <p className="text-off-white/70 font-medium max-w-2xl mx-auto">A thriving marketplace requires two strong sides. Here is what we deliver to both.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* For Hunters */}
            <div className="bg-olive/50 border border-kalahari/30 rounded-3xl p-8 md:p-12 shadow-xl hover:border-kalahari transition-colors group">
              <div className="h-16 w-16 bg-black/50 rounded-2xl flex items-center justify-center mb-8 border border-kalahari/20 group-hover:scale-110 transition-transform">
                <Target className="h-8 w-8 text-kalahari" />
              </div>
              <h3 className="text-2xl font-black font-headline text-white mb-4">For the Hunter</h3>
              <p className="text-off-white/70 font-medium mb-6 leading-relaxed">
                Stop guessing. Browse high-resolution photos, read exact package inclusions, and lock in your dates directly with the people running the camp. 
              </p>
              <Link href="/marketplace" className="inline-flex items-center text-kalahari font-bold hover:text-white transition-colors">
                Explore Packages <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* For Outfitters */}
            <div className="bg-olive/50 border border-kalahari/30 rounded-3xl p-8 md:p-12 shadow-xl hover:border-kalahari transition-colors group">
              <div className="h-16 w-16 bg-black/50 rounded-2xl flex items-center justify-center mb-8 border border-kalahari/20 group-hover:scale-110 transition-transform">
                <Globe className="h-8 w-8 text-kalahari" />
              </div>
              <h3 className="text-2xl font-black font-headline text-white mb-4">For the Outfitter</h3>
              <p className="text-off-white/70 font-medium mb-6 leading-relaxed">
                Take control of your bookings. Showcase your lodge, list your packages, and receive direct inquiries from serious hunters around the world.
              </p>
              <Link href="/outfitters/apply" className="inline-flex items-center text-kalahari font-bold hover:text-white transition-colors">
                List Your Business <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* --- THE TRUST GUARANTEE --- */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 md:mt-32 text-center">
        <ShieldCheck className="h-20 w-20 text-kalahari mx-auto mb-6 opacity-80" />
        <h2 className="text-3xl md:text-4xl font-black font-headline text-white mb-6">The Only-Hunts Guarantee</h2>
        <p className="text-lg text-off-white/80 font-medium leading-relaxed mb-10">
          We do not allow just anyone to list on our platform. Every outfitter must pass a verification process, ensuring they are registered, reputable, and capable of delivering the premium experience they advertise. If they don't meet the standard, they don't get on the platform.
        </p>
        <Link 
          href="/marketplace" 
          className="inline-flex items-center justify-center bg-kalahari hover:bg-kalahari/90 text-white font-black px-10 py-4 rounded-xl transition-all hover:shadow-xl hover:-translate-y-1 text-lg"
        >
          Start Your Journey Today
        </Link>
      </section>

    </div>
  );
}