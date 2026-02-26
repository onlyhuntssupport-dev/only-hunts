'use server';

import { z } from 'zod';
import { adminDb } from '@/lib/firebase/admin';

export const LeadSchema = z.object({
  huntId: z.string().min(1),
  outfitterId: z.string().min(1),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Please provide more details in your message'),
  honeypot: z.string().max(0, { message: 'Bots are not welcome.' }).optional(), // Must be empty (bot trap)
});

export type LeadFormData = z.infer<typeof LeadSchema>;

export async function submitLead(data: LeadFormData) {
  try {
    const parsedData = LeadSchema.parse(data);

    // 1. Spam Prevention: If honeypot is filled, silently reject but return success
    if (parsedData.honeypot) {
      console.warn('Bot detected by honeypot on lead submission.');
      return { success: true }; 
    }

    // 2. Prepare the payload
    const leadPayload = {
      huntId: parsedData.huntId,
      outfitterId: parsedData.outfitterId,
      hunterDetails: {
        name: parsedData.name,
        email: parsedData.email,
        phone: parsedData.phone || null,
      },
      message: parsedData.message,
      status: 'new', // new, contacted, booked, lost
      createdAt: new Date().toISOString(),
    };

    // 3. Save to Firestore
    await adminDb.collection('leads').add(leadPayload);

    return { success: true };
  } catch (error) {
    console.error('Error submitting lead:', error);
    if (error instanceof z.ZodError) {
        return { success: false, error: 'Validation failed.', issues: error.errors };
    }
    return { success: false, error: 'Failed to submit inquiry. Please try again.' };
  }
}
