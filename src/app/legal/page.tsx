import { Metadata } from "next";
import Link from "next/link";
import { Scale, ShieldAlert, FileText, ArrowLeft, HeartHandshake, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Legal & Policies | Only-Hunts",
  description: "Terms of Service, Cancellation Policies, and Assumption of Risk for the Only-Hunts platform.",
};

export default function LegalPage() {
  return (
    <div className="bg-olive min-h-screen pt-24 pb-24 text-off-white font-body">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center text-sm font-bold text-kalahari hover:text-white transition-colors mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-black font-headline text-white tracking-tight mb-4 flex items-center gap-4">
            <Scale className="h-10 w-10 text-kalahari" /> Legal & Policies
          </h1>
          <p className="text-off-white/70 font-medium text-lg">
            Protecting our hunters, our outfitters, and the integrity of the South African safari industry. Last updated: April 2026.
          </p>
        </div>

        {/* Content Container */}
        <div className="bg-black/30 border border-kalahari/20 rounded-3xl p-8 md:p-12 shadow-2xl space-y-16">
          
          {/* SECTION 1: Role of the Platform */}
          <section>
            <div className="flex items-center gap-3 mb-6 border-b border-kalahari/20 pb-4">
              <HeartHandshake className="h-6 w-6 text-kalahari" />
              <h2 className="text-2xl font-black font-headline text-white uppercase tracking-wide">1. Role of Only-Hunts</h2>
            </div>
            <div className="space-y-4 text-off-white/80 font-medium leading-relaxed">
              <p>
                <strong>1.1 Technology Facilitator:</strong> Only-Hunts is a digital marketplace and technology facilitator. We provide a platform for verified South African Outfitters to list hunting packages and for Hunters to discover and inquire about them. 
              </p>
              <p>
                <strong>1.2 Not a Safari Operator:</strong> Only-Hunts does not own, operate, or manage any hunting concessions, lodges, or guide services. The legally binding contract for the execution of the safari, including all payments, liability, and deliverables, is strictly between the Hunter and the Outfitter.
              </p>
              <p>
                <strong>1.3 Verification:</strong> While Only-Hunts actively vets Outfitters to ensure they hold necessary permits and maintain high standards, we do not guarantee the specific outcome of any safari.
              </p>
            </div>
          </section>

          {/* SECTION 2: Payments & Cancellations (The Emergency Protocol) */}
          <section>
            <div className="flex items-center gap-3 mb-6 border-b border-kalahari/20 pb-4">
              <FileText className="h-6 w-6 text-kalahari" />
              <h2 className="text-2xl font-black font-headline text-white uppercase tracking-wide">2. Bookings, Cancellations & Emergencies</h2>
            </div>
            <div className="space-y-4 text-off-white/80 font-medium leading-relaxed">
              <p>
                <strong>2.1 The Insurance Mandate:</strong> Hunting safaris require significant upfront capital from Outfitters (permits, camp prep, staff). Because of this, Only-Hunts strongly mandates that all Hunters purchase comprehensive <strong>Third-Party Travel and Medical Cancellation Insurance</strong> prior to their trip.
              </p>
              <p>
                <strong>2.2 Standard Cancellation:</strong> If a Hunter cancels a booked safari, the Outfitter's specific cancellation policy applies. In most cases, initial deposits are strictly non-refundable as they are utilized immediately to secure government permits and dates.
              </p>
              <p className="bg-kalahari/10 border-l-4 border-kalahari p-4 text-white rounded-r-lg">
                <strong>2.3 Emergency Rollover Policy:</strong> We understand that life happens. In the event of a documented medical emergency or unavoidable travel restriction, Only-Hunts will act as a neutral mediator between the Hunter and the Outfitter. While cash refunds are generally not possible, our platform standard encourages Outfitters to offer a <strong>"Deposit Rollover,"</strong> allowing the Hunter to transfer their deposit to the following hunting season.
              </p>
            </div>
          </section>

          {/* SECTION 3: Assumption of Risk */}
          <section>
            <div className="flex items-center gap-3 mb-6 border-b border-kalahari/20 pb-4">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <h2 className="text-2xl font-black font-headline text-white uppercase tracking-wide">3. Assumption of Risk</h2>
            </div>
            <div className="space-y-4 text-off-white/80 font-medium leading-relaxed">
              <p>
                <strong>3.1 Inherent Dangers:</strong> African safaris involve inherent risks, including but not limited to: close proximity to dangerous wildlife, use of high-caliber firearms, off-road travel, and remote locations far from advanced medical facilities.
              </p>
              <p>
                <strong>3.2 Zero Liability:</strong> By using this platform to book a safari, the Hunter acknowledges these risks. Only-Hunts, its founders, and its employees shall bear <strong>zero physical or financial liability</strong> for any injury, illness, death, property damage, or loss sustained during a safari booked through the platform.
              </p>
              <p>
                <strong>3.3 Fair Chase & Trophy Quality:</strong> Hunting is a pursuit of wild animals in their natural habitat. Neither the Outfitter nor Only-Hunts can guarantee a successful harvest, nor can we guarantee the specific horn/tusk measurements (trophy quality) of any animal. 
              </p>
            </div>
          </section>

          {/* SECTION 4: Data & POPIA Compliance */}
          <section>
            <div className="flex items-center gap-3 mb-6 border-b border-kalahari/20 pb-4">
              <ShieldAlert className="h-6 w-6 text-kalahari" />
              <h2 className="text-2xl font-black font-headline text-white uppercase tracking-wide">4. Privacy & POPIA Compliance</h2>
            </div>
            <div className="space-y-4 text-off-white/80 font-medium leading-relaxed">
              <p>
                <strong>4.1 Data Protection:</strong> Only-Hunts complies with the South African Protection of Personal Information Act (POPIA). We collect only the data necessary to facilitate your booking and maintain your account.
              </p>
              <p>
                <strong>4.2 Information Sharing:</strong> When you submit an inquiry for a package, your contact information is shared directly and securely with the specific Outfitter you are contacting. We do not sell your personal data to third-party marketing agencies.
              </p>
            </div>
          </section>

        </div>
        
        <div className="mt-12 text-center text-sm font-bold text-off-white/40 uppercase tracking-widest">
          By creating an account on Only-Hunts, you digitally agree to these terms.
        </div>

      </div>
    </div>
  );
}