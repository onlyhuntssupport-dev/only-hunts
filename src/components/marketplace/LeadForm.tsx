'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LeadSchema, type LeadFormData } from '@/app/actions/leads';
import { submitLead } from '@/app/actions/leads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface LeadFormProps {
  huntId: string;
  outfitterId: string;
  huntTitle: string;
}

export default function LeadForm({ huntId, outfitterId, huntTitle }: LeadFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(LeadSchema),
    defaultValues: { huntId, outfitterId, honeypot: '' },
  });

  const onSubmit = async (data: LeadFormData) => {
    setServerError('');
    const result = await submitLead(data);
    
    if (result.success) {
      setIsSuccess(true);
      reset({ huntId, outfitterId, honeypot: '' });
    } else {
      setServerError(result.error || 'Something went wrong.');
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} size="lg" className="w-full mt-4">
        Inquire About This Hunt
      </Button>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6 mt-4 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-headline text-xl font-bold">Inquire: {huntTitle}</h3>
        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground text-2xl font-light">&times;</button>
      </div>

      {isSuccess ? (
        <div className="p-4 bg-green-50 text-green-800 border border-green-200 rounded-md text-center">
          <p className="font-bold">Inquiry Sent!</p>
          <p className="text-sm mt-1">The outfitter will contact you shortly.</p>
          <Button variant="outline" className="mt-4 w-full" onClick={() => { setIsOpen(false); setIsSuccess(false); }}>Close</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Honeypot field - invisible to users */}
          <div className="hidden" aria-hidden="true">
            <input type="text" {...register('honeypot')} tabIndex={-1} autoComplete="off" />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
            <Input 
              id="name"
              {...register('name')} 
              placeholder="John Doe"
            />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <Input
                id="email"
                {...register('email')} 
                type="email" 
                placeholder="john@example.com"
              />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone (Optional)</label>
              <Input
                id="phone"
                {...register('phone')} 
                type="tel" 
                placeholder="+27 82 000 0000"
              />
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
            <Textarea 
              id="message"
              {...register('message')} 
              rows={4} 
              placeholder="I'm interested in booking this hunt for 2 people next season..."
            />
            {errors.message && <p className="text-destructive text-xs mt-1">{errors.message.message}</p>}
          </div>

          {serverError && <p className="text-destructive text-sm font-medium">{serverError}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="animate-spin mr-2" />}
            {isSubmitting ? 'Sending...' : 'Send Inquiry'}
          </Button>
        </form>
      )}
    </div>
  );
}
