
'use client';

import { useOptimistic, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toggleWishlist } from '@/app/actions/wishlist';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface WishlistButtonProps {
  huntId: string;
  hunterId: string;
  isInitiallySaved: boolean;
  className?: string;
}

export default function WishlistButton({ huntId, hunterId, isInitiallySaved, className }: WishlistButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticIsSaved, setOptimisticIsSaved] = useOptimistic(isInitiallySaved);
  const { toast } = useToast();

  const handleClick = async () => {
    startTransition(async () => {
      setOptimisticIsSaved(!optimisticIsSaved);
      const result = await toggleWishlist(hunterId, huntId);
      if (!result.success) {
        setOptimisticIsSaved(optimisticIsSaved); // Revert on error
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else {
        toast({
            title: result.isSaved ? 'Hunt Saved!' : 'Hunt Unsaved',
            description: result.isSaved ? 'This hunt has been added to your wishlist.' : 'This hunt has been removed from your wishlist.',
        });
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isPending}
      className={cn('shrink-0', className)}
      aria-label={optimisticIsSaved ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart className={cn(
          'transition-all', 
          optimisticIsSaved ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
      )} />
    </Button>
  );
}
