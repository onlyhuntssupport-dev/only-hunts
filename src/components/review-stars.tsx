import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

type ReviewStarsProps = {
  rating: number;
  className?: string;
  starSize?: number;
};

export function ReviewStars({ rating, className, starSize = 5 }: ReviewStarsProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn('flex items-center gap-1 text-secondary', className)}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className={cn('fill-current', `h-${starSize} w-${starSize}`)} />
      ))}
      {hasHalfStar && <StarHalf key="half" className={cn('fill-current', `h-${starSize} w-${starSize}`)} />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className={cn('fill-muted', `h-${starSize} w-${starSize}`)} />
      ))}
    </div>
  );
}
