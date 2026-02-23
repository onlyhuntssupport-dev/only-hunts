"use client";

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { hunts, outfitters } from '@/lib/data';

const PROVINCES = [...new Set(outfitters.map(o => o.location.split(',')[0]))];
const SPECIES = [...new Set(hunts.flatMap(h => h.species))].sort();

export default function FilterSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleToggle = useCallback(
    (type: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const currentValues = params.get(type)?.split(',') || [];

      if (currentValues.includes(value)) {
        const nextValues = currentValues.filter((v) => v !== value);
        if (nextValues.length > 0) params.set(type, nextValues.join(','));
        else params.delete(type);
      } else {
        currentValues.push(value);
        params.set(type, currentValues.join(','));
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );
  
  const createCheckboxGroup = (title: string, items: string[], paramName: 'province' | 'species') => (
    <div className="mb-6">
      <h3 className="font-semibold text-foreground mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center space-x-2">
            <Checkbox
              id={`${paramName}-${item}`}
              checked={searchParams.get(paramName)?.includes(item) || false}
              onCheckedChange={() => handleToggle(paramName, item)}
            />
            <Label htmlFor={`${paramName}-${item}`} className="font-normal text-muted-foreground cursor-pointer">{item}</Label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <aside className="w-full md:w-72 shrink-0 bg-card p-6 border rounded-lg h-fit sticky top-24">
      <h2 className="text-xl font-headline font-bold text-foreground mb-4">Filters</h2>
      {createCheckboxGroup('Province', PROVINCES, 'province')}
      {createCheckboxGroup('Species', SPECIES, 'species')}
    </aside>
  );
}
