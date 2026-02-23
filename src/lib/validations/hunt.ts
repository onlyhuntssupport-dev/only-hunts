import { z } from 'zod';

export const HuntSchema = z.object({
  id: z.string(),
  title: z.string().min(5, "Title too short"),
  outfitterId: z.string(),
  outfitterName: z.string(),
  // Flexible base currency support
  basePrice: z.number().positive(),
  baseCurrency: z.enum(['USD', 'EUR', 'ZAR']),
  // Species and Location
  species: z.array(z.string()),
  province: z.enum(['Limpopo', 'Eastern Cape', 'North West', 'Free State', 'Mpumalanga', 'Northern Cape', 'KwaZulu-Natal']),
  // Media & Trust
  imageUrl: z.string().url(),
  isVerified: z.boolean().default(false),
  createdAt: z.any(), // Firebase Timestamp
});

export type Hunt = z.infer<typeof HuntSchema>;