import { z } from 'zod';

export const InquirySchema = z.object({
  id: z.string().optional(),
  huntId: z.string(),
  huntTitle: z.string(),
  outfitterId: z.string(),
  hunterId: z.string(),
  hunterName: z.string(),
  hunterEmail: z.string().email(),
  message: z.string().min(10, "Please provide more details about your request."),
  preferredDate: z.string().optional(),
  createdAt: z.any(),
  updatedAt: z.any().optional(),
  status: z.enum(['new', 'responded', 'booked', 'archived']).default('new'),
});

export type Inquiry = z.infer<typeof InquirySchema>;
