import { HuntCard } from '@/components/hunt-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { hunts } from '@/lib/data';
import { ListFilter, Search } from 'lucide-react';

const speciesFilters = ["Kudu", "Impala", "Wildebeest", "Springbok", "Gemsbok", "Eland", "Bushbuck"];
const typeFilters = ["Rifle", "Bow", "Rifle/Bow"];

export default function HuntsPage() {
  return (
    <div className="container mx-auto max-w-7xl py-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold">Find Your Next Hunt</h1>
        <p className="text-muted-foreground mt-2">
          Browse through our curated list of hunting packages from top South African outfitters.
        </p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Filters</CardTitle>
              <ListFilter className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="search-species" className="font-semibold">Search Species</Label>
                <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="search-species" placeholder="e.g. Kudu" className="pl-8" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Target Species</h4>
                {speciesFilters.slice(0, 5).map(species => (
                  <div key={species} className="flex items-center space-x-2">
                    <Checkbox id={`species-${species}`} />
                    <Label htmlFor={`species-${species}`} className="font-normal">{species}</Label>
                  </div>
                ))}
                <p className="text-sm text-primary cursor-pointer hover:underline">+2 more</p>
              </div>
               <div className="space-y-2">
                <h4 className="font-semibold">Hunt Type</h4>
                {typeFilters.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox id={`type-${type}`} />
                    <Label htmlFor={`type-${type}`} className="font-normal">{type}</Label>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold">Price Range</h4>
                <Slider
                    defaultValue={[5000]}
                    max={15000}
                    step={500}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>$0</span>
                    <span>$15,000+</span>
                </div>
              </div>
              <Button className="w-full">Apply Filters</Button>
            </CardContent>
          </Card>
        </aside>
        <main className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row justify-between items-baseline mb-4">
                <p className="text-muted-foreground mb-2 sm:mb-0">Showing {hunts.length} hunts</p>
                <div className="flex items-center gap-2">
                    <Label htmlFor="sort-by">Sort by:</Label>
                    <Select defaultValue="featured">
                        <SelectTrigger id="sort-by" className="w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="featured">Featured</SelectItem>
                            <SelectItem value="price-asc">Price: Low to High</SelectItem>
                            <SelectItem value="price-desc">Price: High to Low</SelectItem>
                            <SelectItem value="rating">Rating</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {hunts.map(hunt => (
                <HuntCard key={hunt.id} hunt={hunt} currency="USD" />
                ))}
            </div>
            <div className="mt-8 text-center">
                <Button variant="outline">Load More</Button>
            </div>
        </main>
      </div>
    </div>
  );
}
