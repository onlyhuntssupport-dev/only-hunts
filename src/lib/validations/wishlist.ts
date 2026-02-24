
import { z } from 'zod';

export const WishlistSchema = z.object({
  huntIds: z.array(z.string()),
});

export type Wishlist = z.infer<typeof WishlistSchema>;
