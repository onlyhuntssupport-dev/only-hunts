import { z } from 'zod';

export const HuntSchema = z.object({
  id: z.string(),
  title: z.string().min(5),
  outfitterId: z.string(),
  outfitterName: z.string(),
  basePrice: z.number().positive(),
  baseCurrency: z.enum(['USD', 'EUR', 'ZAR']),
  species: z.array(z.string()),
  province: z.enum(['Limpopo', 'Eastern Cape', 'North West', 'Free State', 'Mpumalanga', 'Northern Cape', 'KwaZulu-Natal']),
  imageUrl: z.string().url(),
  isVerified: z.boolean().default(false),
  createdAt: z.any(),
});

export type Hunt = z.infer<typeof HuntSchema>;
