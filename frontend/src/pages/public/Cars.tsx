import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, SlidersHorizontal, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { CarCard } from '@/components/public/CarCard';
import { SearchWidget } from '@/components/public/SearchWidget';
import { cars as mockCars, brands, categories, type CarCategory, type Transmission, type Car } from '@/mock/data';
import { usePublicCars } from '@/lib/hooks/useCars';
import { apiCarToCar, unwrapCars } from '@/lib/adapters';

function FilterPanel({ state, set }: { state: any; set: any }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-sm mb-3">{t('cars.price')} (₺/gün)</h4>
        <Slider min={300} max={3500} step={100} value={state.price} onValueChange={(v) => set({ ...state, price: v })} />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>₺{state.price[0]}</span><span>₺{state.price[1]}</span>
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-3">{t('cars.category')}</h4>
        <div className="space-y-2">
          {categories.map(c => (
            <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm">
              <Checkbox checked={state.cats.includes(c.id)} onCheckedChange={(v) => {
                set({ ...state, cats: v ? [...state.cats, c.id] : state.cats.filter((x: string) => x !== c.id) });
              }} />
              <span>{c.nameTr}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-3">{t('cars.brand')}</h4>
        <div className="space-y-2 max-h-48 overflow-auto">
          {brands.map(b => (
            <label key={b} className="flex items-center gap-2 cursor-pointer text-sm">
              <Checkbox checked={state.brands.includes(b)} onCheckedChange={(v) => {
                set({ ...state, brands: v ? [...state.brands, b] : state.brands.filter((x: string) => x !== b) });
              }} />
              <span>{b}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-3">{t('cars.transmission')}</h4>
        {(['automatic', 'manual'] as Transmission[]).map(tr => (
          <label key={tr} className="flex items-center gap-2 cursor-pointer text-sm py-1">
            <Checkbox checked={state.trans.includes(tr)} onCheckedChange={(v) => {
              set({ ...state, trans: v ? [...state.trans, tr] : state.trans.filter((x: string) => x !== tr) });
            }} />
            <span className="capitalize">{tr}</span>
          </label>
        ))}
      </div>
      <div>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <Checkbox checked={state.instant} onCheckedChange={(v) => set({ ...state, instant: !!v })} />
          <Zap className="h-3.5 w-3.5 text-success" />
          <span>Instant book only</span>
        </label>
      </div>
    </div>
  );
}

export default function Cars() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const cityFilter = params.get('city');
  const catFilter = params.get('category') as CarCategory | null;

  const [state, setState] = useState({
    price: [300, 3500],
    cats: catFilter ? [catFilter] : [],
    brands: [] as string[],
    trans: [] as Transmission[],
    instant: false,
  });
  const [sort, setSort] = useState<'price-asc' | 'price-desc' | 'rating' | 'newest'>('rating');

  const apiQuery = usePublicCars({ city: cityFilter ?? undefined, limit: 60 });
  const cars: Car[] = useMemo(() => {
    const apiList = unwrapCars(apiQuery.data).map(apiCarToCar);
    return apiList.length > 0 ? apiList : mockCars;
  }, [apiQuery.data]);
  const usingDemo = !apiQuery.isLoading && unwrapCars(apiQuery.data).length === 0;

  const filtered = useMemo(() => {
    let r = cars.filter(c =>
      c.pricePerDay >= state.price[0] && c.pricePerDay <= state.price[1] &&
      (state.cats.length === 0 || state.cats.includes(c.category)) &&
      (state.brands.length === 0 || state.brands.includes(c.brand)) &&
      (state.trans.length === 0 || state.trans.includes(c.transmission)) &&
      (!state.instant || c.instantBook) &&
      (!cityFilter || c.city === cityFilter)
    );
    if (sort === 'price-asc') r = [...r].sort((a, b) => a.pricePerDay - b.pricePerDay);
    if (sort === 'price-desc') r = [...r].sort((a, b) => b.pricePerDay - a.pricePerDay);
    if (sort === 'rating') r = [...r].sort((a, b) => b.rating - a.rating);
    if (sort === 'newest') r = [...r].sort((a, b) => b.year - a.year);
    return r;
  }, [cars, state, sort, cityFilter]);

  return (
    <div>
      <div className="bg-muted/30 border-b">
        <div className="container py-6">
          <SearchWidget compact />
        </div>
      </div>
      <div className="container py-8 grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="hidden lg:block">
          <Card className="p-5 sticky top-20"><FilterPanel state={state} set={setState} /></Card>
        </aside>
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="font-display text-2xl font-bold">{filtered.length} {t('nav.cars').toLowerCase()}</h1>
              {cityFilter && <p className="text-sm text-muted-foreground">in {cityFilter}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4 mr-1.5" /> {t('cars.filters')}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-auto">
                  <div className="mt-6"><FilterPanel state={state} set={setState} /></div>
                </SheetContent>
              </Sheet>
              <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="h-9 rounded-lg border bg-background px-3 text-sm">
                <option value="rating">Top rated</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
          {apiQuery.isLoading ? (
            <Card className="p-16 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading cars…
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="p-16 text-center text-muted-foreground">{t('cars.noResults')}</Card>
          ) : (
            <>
              {usingDemo && (
                <p className="text-xs text-muted-foreground mb-3">Showing demo inventory while live cars sync.</p>
              )}
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(c => <CarCard key={c.id} car={c} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
