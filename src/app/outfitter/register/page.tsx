"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { uploadWithCompression } from "@/lib/firebase/storageHelper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, ShieldCheck, FileText, Globe, Award, Crosshair, CheckCircle2, MapPin } from "lucide-react";
import Link from "next/link";

const SUPPORTED_COUNTRIES = [
  "South Africa",
  "Namibia",
  "Zimbabwe",
  "Botswana",
  "Mozambique"
];

export default function OutfitterRegistration() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phonePrefix: "+27", 
    phone: "",
    baseCountry: "South Africa",
    operatingCountries: ["South Africa"] as string[],
    affiliations: "",
    password: "",
    confirmPassword: "",
  });
  const [permitFile, setPermitFile] = useState<File | null>(null);

  const validatePhone = (phone: string) => /^\+[1-9]\d{6,14}$/.test(phone);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleOperatingCountry = (country: string) => {
    setFormData(prev => {
      const current = prev.operatingCountries;
      if (current.includes(country)) {
        // Don't allow removing the base country
        if (country === prev.baseCountry) return prev;
        return { ...prev, operatingCountries: current.filter(c => c !== country) };
      } else {
        return { ...prev, operatingCountries: [...current, country] };
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPermitFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!permitFile) {
      setError("Please upload your professional outfitter permit or license.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    const cleanedDigits = formData.phone.replace(/\D/g, "");
    const finalizedPhone = cleanedDigits.startsWith("0") ? cleanedDigits.substring(1) : cleanedDigits;
    const fullPhoneNumber = `${formData.phonePrefix}${finalizedPhone}`;

    if (!validatePhone(fullPhoneNumber)) {
      setError("Please enter a valid phone number with 7 to 15 digits.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      const uid = user.uid;

      const fileExtension = permitFile.name.split('.').pop();
      const fileName = `outfitter_permits/${uid}_base_${Date.now()}.${fileExtension}`;
      const permitUrl = await uploadWithCompression(permitFile, fileName);

      // Construct the payload
      const outfitterPayload = {
        name: formData.name,
        email: formData.email,
        phone: fullPhoneNumber, 
        baseCountry: formData.baseCountry,
        operatingCountries: formData.operatingCountries,
        location: formData.baseCountry, // Backward compatibility
        affiliations: formData.affiliations,
        permitUrl: permitUrl,
        status: "PENDING",
        tier: "standard", 
        isAdminOverride: false,
        totalListings: 0,
        createdAt: new Date().toISOString(),
      };

      // Save to main public document
      await setDoc(doc(db, "outfitters", uid), outfitterPayload);

      // Keep the private backup
      await setDoc(doc(db, `outfitters/${uid}/private/contact`), {
        phone: fullPhoneNumber
      });

      await setDoc(doc(db, "users", uid), {
        name: formData.name,
        email: formData.email,
        role: "OUTFITTER",
        baseCountry: formData.baseCountry,
        operatingCountries: formData.operatingCountries,
        permitUrl: permitUrl, 
        createdAt: new Date().toISOString(),
      });

      // Internal Admin WhatsApp Alert
      try {
        await fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: `🦌 New Outfitter Registration!\nName: ${formData.name}\nEmail: ${formData.email}\nBase: ${formData.baseCountry}\nCountries: ${formData.operatingCountries.join(", ")}\nPlease check the admin dashboard to verify permits.`
          })
        });
      } catch (err) {
        console.error("WhatsApp alert failed to fire:", err);
      }

      // --- EMAIL ENGINE DISPATCH ---
      try {
        const idToken = await user.getIdToken(true);
        await fetch('/api/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            to: formData.email,
            subject: "Application Received: Welcome to Only-Hunts",
            userName: formData.name,
            title: "Outfitter Application Under Review",
            message: `Thank you for applying to join the Only-Hunts Professional Partner Network for ${formData.operatingCountries.join(" & ")}. Your permits are currently being verified. Once approved, you will unlock full access to the dashboard.`,
            ctaText: "Go to Dashboard",
            ctaLink: "https://www.only-hunts.com/outfitter/dashboard",
          }),
        });
      } catch (emailErr) {
        console.error("Welcome email dropped", emailErr);
      }

      router.push("/outfitter/dashboard");

    } catch (err: any) {
      console.error("Registration Error:", err);
      setError(err.message || "Failed to create account. Please try again.");
      setLoading(false);
    } 
  };

  return (
    <div className="min-h-screen bg-stone-950 flex">
      {/* LEFT COLUMN */}
      <div className="hidden lg:flex lg:w-[45%] bg-stone-950 flex-col justify-between p-12 xl:p-16 text-white relative overflow-y-auto border-r border-stone-800">
        <div className="absolute inset-0 opacity-10 bg-[url('/pattern.svg')]"></div>
        <div className="relative z-10">
          <Link href="/" className="text-3xl font-black text-kalahari tracking-tighter hover:text-kalahari/80 transition-colors">ONLY-HUNTS</Link>
          <h1 className="mt-12 text-4xl xl:text-5xl font-black tracking-tight leading-tight">
            Transparent Pricing.<br/>Zero Upfront Fees.
          </h1>
          <p className="mt-4 text-lg text-stone-400 font-medium max-w-md">
            Join the premier marketplace for professional outfitters. Expand your reach across Southern Africa.
          </p>
        </div>

        <div className="relative z-10 mt-10 space-y-6">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-green-500" /> Standard
                </h3>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mt-1">Default Plan</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white">R0</span><span className="text-stone-500 font-bold">/mo</span>
              </div>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start text-sm font-medium text-stone-300">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" /> 12% Platform Commission on deposits.
              </li>
              <li className="flex items-start text-sm font-medium text-stone-300">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" /> Unlimited hunt listings.
              </li>
              <li className="flex items-start text-sm font-medium text-stone-300">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" /> Global Multi-Country Support.
              </li>
            </ul>
          </div>
          <div className="bg-kalahari/5 border-2 border-kalahari/30 rounded-2xl p-6 relative shadow-2xl">
            <div className="absolute -top-3 right-4 bg-kalahari text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
              Optional Upgrade
            </div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Crosshair className="h-5 w-5 text-kalahari" /> Only-Hunts <span className="bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded text-sm border border-stone-700 shadow-inner">PRO</span>
                </h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white">R800</span><span className="text-kalahari/70 font-bold">/mo</span>
              </div>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start text-sm font-medium text-stone-200">
                <CheckCircle2 className="h-4 w-4 text-kalahari mr-2 shrink-0 mt-0.5" /> Reduced 8% Platform Commission.
              </li>
              <li className="flex items-start text-sm font-medium text-stone-200">
                <CheckCircle2 className="h-4 w-4 text-kalahari mr-2 shrink-0 mt-0.5" /> Unlocks the Auto-Quote Engine.
              </li>
            </ul>
          </div>
        </div>
        
        <div className="relative z-10 mt-8 text-xs font-medium text-stone-500 leading-relaxed p-4">
          * Commission is deducted from the upfront deposit. You collect the remaining balance directly from the client.
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-stone-950 relative overflow-y-auto">
        <div className="absolute inset-0 bg-[url('/outfitter-pricing-bg.jpg')] bg-cover bg-center opacity-50 mix-blend-lighten"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/40 to-stone-950/85"></div>

        <div className="mx-auto w-full max-w-sm lg:max-w-md relative z-10">
          <div className="lg:hidden mb-8">
              <Link href="/" className="text-3xl font-black text-kalahari tracking-tighter">ONLY-HUNTS</Link>
          </div>
          
          <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Apply as an Outfitter</h2>
          <p className="mt-2 text-sm text-kalahari font-bold uppercase tracking-widest drop-shadow-md">Southern African Partner Network</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="bg-red-900/40 backdrop-blur-md text-red-300 p-4 rounded-md text-sm font-bold border border-red-800">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-200 mb-1 drop-shadow-sm">Business Name</label>
                <Input suppressHydrationWarning name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. African Safari Co." className="h-12 bg-stone-900/70 backdrop-blur-md border-stone-700 text-white placeholder:text-stone-400 focus-visible:ring-kalahari shadow-inner" disabled={loading} />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-200 mb-1 drop-shadow-sm">Email</label>
                <Input suppressHydrationWarning type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="contact@company.com" className="h-12 bg-stone-900/70 backdrop-blur-md border-stone-700 text-white placeholder:text-stone-400 focus-visible:ring-kalahari shadow-inner" disabled={loading} />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-200 mb-1 drop-shadow-sm">Contact Number</label>
                <div className="flex gap-2">
                  <select
                    suppressHydrationWarning
                    name="phonePrefix"
                    value={formData.phonePrefix}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-1/3 h-12 px-2 bg-stone-900/70 backdrop-blur-md border border-stone-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-kalahari shadow-inner"
                  >
                    <option value="+27">🇿🇦 +27</option>
                    <option value="+264">🇳🇦 +264</option>
                    <option value="+263">🇿🇼 +263</option>
                    <option value="+267">🇧🇼 +267</option>
                    <option value="+258">🇲🇿 +258</option>
                    <option value="+1">🇺🇸 +1</option>
                  </select>
                  <Input 
                    suppressHydrationWarning 
                    type="tel" 
                    name="phone" 
                    required 
                    value={formData.phone} 
                    onChange={handleChange} 
                    placeholder="82 123 4567" 
                    className="w-2/3 h-12 bg-stone-900/70 backdrop-blur-md border-stone-700 text-white placeholder:text-stone-400 focus-visible:ring-kalahari shadow-inner" 
                    disabled={loading} 
                  />
                </div>
              </div>

              {/* Base Country */}
              <div>
                <label className="block text-sm font-bold text-stone-200 mb-1 drop-shadow-sm">Headquarters Country</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400 z-10" />
                  <select
                    suppressHydrationWarning
                    name="baseCountry"
                    required
                    value={formData.baseCountry}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        baseCountry: val,
                        operatingCountries: Array.from(new Set([...prev.operatingCountries, val]))
                      }));
                    }}
                    disabled={loading}
                    className="w-full h-12 pl-10 pr-10 bg-stone-900/70 backdrop-blur-md border border-stone-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-kalahari shadow-inner appearance-none relative z-0"
                  >
                    {SUPPORTED_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none z-10">
                    <MapPin className="w-4 h-4 text-stone-500" />
                  </div>
                </div>
              </div>

              {/* Operating Countries Multi-Select */}
              <div>
                <label className="block text-sm font-bold text-stone-200 mb-3 drop-shadow-sm">Additional Operating Regions</label>
                <div className="grid grid-cols-2 gap-2">
                  {SUPPORTED_COUNTRIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleOperatingCountry(c)}
                      disabled={loading}
                      className={`px-3 py-2 rounded-lg text-xs font-black transition-all border ${
                        formData.operatingCountries.includes(c)
                          ? "bg-kalahari border-kalahari text-white shadow-lg"
                          : "bg-stone-900/50 border-stone-700 text-stone-400 hover:border-kalahari/50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-200 mb-1 flex items-center gap-2 drop-shadow-sm">
                  Industry Affiliations <span className="text-[10px] font-black text-stone-300 uppercase tracking-wider bg-stone-800/80 px-2 py-0.5 rounded">Optional</span>
                </label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                  <Input suppressHydrationWarning name="affiliations" value={formData.affiliations} onChange={handleChange} placeholder="e.g. PHASA, NAPHA, ZPHGA" className="h-12 pl-10 bg-stone-900/70 backdrop-blur-md border-stone-700 text-white placeholder:text-stone-400 focus-visible:ring-kalahari shadow-inner" disabled={loading} />
                </div>
              </div>

              <div className="border-t border-stone-700/50 pt-5 mt-2">
                <label className="block text-sm font-bold text-stone-200 mb-1 drop-shadow-sm">Professional Permit / License</label>
                <p className="text-xs text-stone-400 mb-3 font-medium">Upload your primary outfitter license. You can add region-specific permits later in your profile.</p>
                <div className="flex items-center justify-center w-full mb-4">
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-stone-600 border-dashed rounded-xl cursor-pointer bg-stone-900/50 backdrop-blur-md hover:bg-stone-900/80 hover:border-kalahari/70 transition-colors shadow-inner ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileText className={`w-8 h-8 mb-3 ${permitFile ? 'text-kalahari' : 'text-stone-500'}`} />
                      <p className="mb-1 text-sm text-stone-300">
                        <span className="font-bold text-stone-100">Upload Base License</span>
                      </p>
                      <p className="text-xs font-bold text-kalahari mt-1">{permitFile ? permitFile.name : "PDF, PNG, or JPG (Max 5MB)"}</p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} disabled={loading} />
                  </label>
                </div>
              </div>

              <div className="border-t border-stone-700/50 pt-5 mt-2 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-200 mb-1 drop-shadow-sm">Password</label>
                  <Input suppressHydrationWarning type="password" name="password" required minLength={6} value={formData.password} onChange={handleChange} placeholder="Create a strong password" className="h-12 bg-stone-900/70 backdrop-blur-md border-stone-700 text-white placeholder:text-stone-400 focus-visible:ring-kalahari shadow-inner" disabled={loading} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-200 mb-1 drop-shadow-sm">Confirm Password</label>
                  <Input suppressHydrationWarning type="password" name="confirmPassword" required minLength={6} value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" className="h-12 bg-stone-900/70 backdrop-blur-md border-stone-700 text-white placeholder:text-stone-400 focus-visible:ring-kalahari shadow-inner" disabled={loading} />
                </div>
              </div>
            </div>

            <Button suppressHydrationWarning type="submit" disabled={loading} className="w-full h-14 text-lg bg-kalahari hover:bg-kalahari/90 text-white gap-2 font-black mt-6 rounded-xl shadow-[0_0_20px_rgba(209,164,123,0.2)] transition-all">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <>Complete Registration <ArrowRight className="h-5 w-5" /></>
              )}
            </Button>
            
            <p className="text-center text-sm text-stone-400 font-medium mt-4">
              Already have an account? <Link href="/login" className="text-kalahari font-bold hover:text-white transition-colors">Sign in here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}