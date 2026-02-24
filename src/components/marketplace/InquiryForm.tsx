'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { type Hunt } from '@/lib/validations/hunt';
import { submitInquiry } from '@/app/actions/inquiries';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import Link from 'next/link';

const FormSchema = z.object({
  message: z.string().min(10, {
    message: 'Message must be at least 10 characters.',
  }),
  consent_share: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to share your contact information.' }),
  }),
  consent_marketing: z.boolean().default(false).optional(),
});

interface InquiryFormProps {
  hunt: Hunt;
}

export function InquiryForm({ hunt }: InquiryFormProps) {
  const { user, loading } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      message: '',
      consent_share: false,
      consent_marketing: false,
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to send an inquiry.',
      });
      return;
    }

    setIsSubmitting(true);

    const inquiryData = {
      huntId: hunt.id,
      huntTitle: hunt.title,
      outfitterId: hunt.outfitterId,
      hunterId: user.uid,
      hunterName: user.displayName || 'Anonymous Hunter',
      hunterEmail: user.email || '',
      message: data.message,
    };

    try {
      const result = await submitInquiry(inquiryData);
      if (result.success) {
        toast({
          title: 'Inquiry Sent!',
          description: "The outfitter has been notified and will respond shortly.",
        });
        setOpen(false);
        form.reset();
      } else {
        throw new Error(result.error || 'An unknown error occurred.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <Button size="lg" className="w-full" disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</Button>;
  }

  if (!user) {
    return (
      <Button size="lg" className="w-full" asChild>
        <Link href={`/login?redirect=/hunts/${hunt.id}`}>
            <MessageSquare className="mr-2" />
            Log In to Contact Outfitter
        </Link>
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full">
          <MessageSquare className="mr-2" />
          Contact Outfitter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact {hunt.outfitterName}</DialogTitle>
          <DialogDescription>
            Ask a question about the "{hunt.title}" package.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`Hi, I'm interested in the ${hunt.title} package. I'd like to know more about...`}
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4 pt-4 border-t">
              <FormField
                control={form.control}
                name="consent_share"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <label
                        htmlFor="consent_share"
                        className="text-xs font-normal text-muted-foreground"
                      >
                        I agree to share my contact details with the Outfitter for the purpose of this inquiry in accordance with the{' '}
                        <Link href="/legal/privacy" className="underline hover:text-primary">
                          Privacy Policy
                        </Link>.
                      </label>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="consent_marketing"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-xs font-normal text-muted-foreground">
                        Keep me updated with new hunts and South African hunting news (Optional).
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Sending...' : 'Send Inquiry'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
