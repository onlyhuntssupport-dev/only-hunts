import { ShieldCheck, Lock, BadgeCheck, Headset } from "lucide-react";

export default function TrustBanner() {
  const trustSignals = [
    {
      icon: <ShieldCheck className="h-6 w-6 text-orange-500" />,
      title: "100% Verified Outfitters",
      subtitle: "Strict vetting process"
    },
    {
      icon: <Lock className="h-6 w-6 text-orange-500" />,
      title: "Secure Payments",
      subtitle: "Bank-level encryption"
    },
    {
      icon: <BadgeCheck className="h-6 w-6 text-orange-500" />,
      title: "Guaranteed Bookings",
      subtitle: "No double-booking"
    },
    {
      icon: <Headset className="h-6 w-6 text-orange-500" />,
      title: "Local SA Support",
      subtitle: "We know the bushveld"
    }
  ];

  return (
    <div className="w-full bg-black/60 border-y border-kalahari/20 py-6 z-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x-0 md:divide-x divide-kalahari/20">
          {trustSignals.map((signal, index) => (
            <div key={index} className="flex flex-col items-center justify-center px-4">
              <div className="bg-orange-500/10 p-3 rounded-full mb-3 shadow-inner border border-orange-500/20">
                {signal.icon}
              </div>
              <h3 className="text-off-white font-bold text-sm uppercase tracking-wide mb-1">
                {signal.title}
              </h3>
              <p className="text-off-white/50 text-xs font-medium">
                {signal.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}