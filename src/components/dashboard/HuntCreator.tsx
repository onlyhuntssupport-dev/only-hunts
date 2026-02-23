'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HuntSchema } from '@/lib/validations/hunt';
import { Upload, DollarSign, MapPin } from 'lucide-react';

export default function HuntCreator({ outfitterId, outfitterName }: { outfitterId: string, outfitterName: string }) {
  const [step, setStep] = useState(1);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(HuntSchema),
    defaultValues: {
      outfitterId,
      outfitterName,
      isVerified: false,
      species: [],
    }
  });

  const onSubmit = async (data: any) => {
    // This will trigger our Server Action to save to Firestore
    console.log("Submitting Hunt Data:", data);
  };

  return (
    <div className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Step Indicator */}
      <div className="bg-slate-50 px-8 py-4 border-b border-gray-100 flex gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-2 flex-1 rounded-full ${step >= i ? 'bg-olive' : 'bg-gray-200'}`} />
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-sm font-bold text-olive mb-2">Hunt Title</label>
              <input 
                {...register('title')} 
                placeholder="e.g. 7-Day Trophy Kudu Safari"
                className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-kalahari outline-none"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message as string}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-olive mb-2">Base Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input 
                    type="number" 
                    {...register('basePrice', { valueAsNumber: true })}
                    className="w-full pl-10 p-3 rounded-lg border border-gray-200 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-olive mb-2">Currency</label>
                <select {...register('baseCurrency')} className="w-full p-3 rounded-lg border border-gray-200 outline-none">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="ZAR">ZAR (R)</option>
                </select>
              </div>
            </div>
            
            <button 
              type="button" 
              onClick={() => setStep(2)} 
              className="w-full py-3 bg-olive text-white font-bold rounded-lg hover:bg-opacity-90 transition-all"
            >
              Next: Species & Location
            </button>
          </div>
        )}

        {/* Step 2 & 3 would follow similar patterns for Species and Image Uploads */}
      </form>
    </div>
  );
}
