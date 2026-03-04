
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, DollarSign, Loader2, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadHuntImage } from '@/lib/firebase/storage';
import { createHunt } from '@/app/actions/hunts';
import { useRouter } from 'next/navigation';
import { Textarea } from '../ui/textarea';

// Schemas for each step for clear validation
const step1Schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(20, "Please provide a description of at least 20 characters."),
  basePrice: z.coerce.number().positive("Price must be a positive number."),
  baseCurrency: z.enum(['USD', 'EUR', 'ZAR']),
});

const step2Schema = z.object({
  province: z.enum(['Limpopo', 'Eastern Cape', 'North West', 'Free State', 'Mpumalanga', 'Northern Cape', 'KwaZulu-Natal']),
  species: z.string().min(3, "Enter at least one species.").transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
});

export default function HuntCreator({ outfitterId, outfitterName }: { outfitterId: string, outfitterName: string }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    outfitterId,
    outfitterName
  });
  const [file, setFile] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const { control: control1, handleSubmit: handleSubmit1, formState: { errors: errors1 } } = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: { title: formData.title || '', description: formData.description || '', basePrice: formData.basePrice || undefined, baseCurrency: formData.baseCurrency || 'USD' }
  });

  const { control: control2, handleSubmit: handleSubmit2, formState: { errors: errors2 } } = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: { province: formData.province || 'Limpopo', species: formData.species ? formData.species.join(', ') : '' }
  });
  
  const handleNextStep1 = (data: any) => {
    setFormData({ ...formData, ...data });
    setStep(2);
  };
  
  const handleNextStep2 = (data: any) => {
    setFormData({ ...formData, ...data });
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'Upload Required', description: 'Please select a cover image for the hunt.' });
      return;
    }
    
    setIsPublishing(true);
    try {
      const imageUrl = await uploadHuntImage(file, outfitterId);
      
      const finalHuntData = {
        ...formData,
        imageUrl,
      };

      const result = await createHunt(finalHuntData, outfitterId);

      if (result.success) {
        toast({ title: 'Hunt Submitted!', description: `${finalHuntData.title} is now pending approval.` });
        router.push('/outfitter/dashboard');
        router.refresh();
      } else {
        throw new Error(result.error || 'Failed to create hunt.');
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Submission Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
    } finally {
      setIsPublishing(false);
    }
  };

  const provinces = ['Limpopo', 'Eastern Cape', 'North West', 'Free State', 'Mpumalanga', 'Northern Cape', 'KwaZulu-Natal'];

  return (
    <div className="max-w-3xl bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="p-6 border-b flex items-center justify-between">
        <div>
            <h2 className="text-xl font-bold font-headline">Create New Hunt Package</h2>
            <p className="text-muted-foreground text-sm">Step {step} of 3</p>
        </div>
        {step > 1 && (
            <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={isPublishing}>
                <ArrowLeft className="mr-2" /> Back
            </Button>
        )}
      </div>

      <div className="px-6 py-4">
        <div className="w-full bg-muted rounded-full h-2.5 mb-6">
          <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(step / 3) * 100}%`, transition: 'width 0.3s ease-in-out' }}></div>
        </div>
      </div>
      
      <div className="p-6">
        {step === 1 && (
          <form onSubmit={handleSubmit1(handleNextStep1)} className="space-y-6 animate-in fade-in">
            <Controller name="title" control={control1} render={({ field }) => (
                <div>
                    <label className="block text-sm font-medium mb-1">Hunt Title</label>
                    <Input {...field} placeholder="e.g. 7-Day Trophy Kudu Safari" />
                    {errors1.title && <p className="text-destructive text-xs mt-1">{errors1.title.message}</p>}
                </div>
            )} />

             <Controller name="description" control={control1} render={({ field }) => (
                <div>
                    <label className="block text-sm font-medium mb-1">Hunt Description</label>
                    <Textarea {...field} placeholder="Describe the lodge, the daily routine, what is included/excluded..." rows={5} />
                    {errors1.description && <p className="text-destructive text-xs mt-1">{errors1.description.message}</p>}
                </div>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller name="basePrice" control={control1} render={({ field }) => (
                    <div>
                        <label className="block text-sm font-medium mb-1">Base Price</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <Input {...field} type="number" step="1" placeholder="4500" className="pl-8" />
                        </div>
                        {errors1.basePrice && <p className="text-destructive text-xs mt-1">{errors1.basePrice.message}</p>}
                    </div>
                )} />
                <Controller name="baseCurrency" control={control1} render={({ field }) => (
                     <div>
                        <label className="block text-sm font-medium mb-1">Currency</label>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USD">USD ($)</SelectItem>
                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                <SelectItem value="ZAR">ZAR (R)</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors1.baseCurrency && <p className="text-destructive text-xs mt-1">{errors1.baseCurrency.message}</p>}
                    </div>
                )} />
            </div>
            
            <Button type="submit" className="w-full">
              Next: Species & Location
            </Button>
          </form>
        )}
        
        {step === 2 && (
            <form onSubmit={handleSubmit2(handleNextStep2)} className="space-y-6 animate-in fade-in">
                <Controller name="province" control={control2} render={({ field }) => (
                    <div>
                        <label className="block text-sm font-medium mb-1">Province</label>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select a province" /></SelectTrigger>
                            <SelectContent>
                                {provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {errors2.province && <p className="text-destructive text-xs mt-1">{errors2.province.message}</p>}
                    </div>
                )} />
                
                <Controller name="species" control={control2} render={({ field }) => (
                    <div>
                        <label className="block text-sm font-medium mb-1">Target Species</label>
                        <Input {...field} placeholder="Kudu, Impala, Warthog" />
                        <p className="text-xs text-muted-foreground mt-1">Enter a comma-separated list.</p>
                        {errors2.species && <p className="text-destructive text-xs mt-1">{errors2.species.message}</p>}
                    </div>
                )} />
                
                <Button type="submit" className="w-full">
                    Next: Upload Photo
                </Button>
            </form>
        )}
        
        {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
                <div>
                    <label className="block text-sm font-medium mb-2">Cover Photo</label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/50">
                    <Input 
                        type="file" 
                        accept="image/jpeg, image/png, image/webp"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        disabled={isPublishing}
                    />
                     {file && <p className="text-xs text-muted-foreground mt-2">Selected: {file.name}</p>}
                    </div>
                </div>

                <Button 
                    type="button" 
                    onClick={handleFinalSubmit}
                    disabled={isPublishing || !file}
                    className="w-full"
                >
                    {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPublishing ? 'Submitting...' : 'Submit for Approval'}
                </Button>
            </div>
        )}
      </div>
    </div>
  );
}
