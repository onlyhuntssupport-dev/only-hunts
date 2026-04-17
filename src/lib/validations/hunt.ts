import { z } from 'zod';

export const HuntSchema = z.object({
  id: z.string().optional(),
  outfitterId: z.string().optional(),
  outfitterName: z.string().optional(),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide a detailed description"),
  location: z.string().min(2, "Location is required"),
  province: z.string().optional(),
  price: z.number().min(1, "Price must be greater than 0"),
  duration: z.number().min(1, "Duration must be at least 1 day"),
  primarySpecies: z.string().min(2, "Primary species is required"),
  species: z.array(z.string()).optional(),
  
  // --- NEW FIELDS ADDED HERE ---
  coverImage: z.string().optional(), 
  images: z.array(z.string()).optional(),
  includedItems: z.string().optional(), 
  excludedItems: z.string().optional(), 
  additionalSpecies: z.string().optional(), 
  // -----------------------------

  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
  isVerified: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type HuntFormData = z.infer<typeof HuntSchema>;
// ALIAS EXPORT ADDED HERE TO FIX TS2305
export type Hunt = z.infer<typeof HuntSchema>;