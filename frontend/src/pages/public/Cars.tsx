import { lazy, Suspense, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, SlidersHorizontal, Zap, List, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { CarCard } from '@/components/public/CarCard';
import { SearchWidget } from '@/components/public/SearchWidget';
import { usePublicCars } from '@/lib/hooks/useCars';
import { useCategories } from '@/lib/hooks/usePublic';
import { categoryName } from '@/lib/categories';
import type { ApiCar } from '@/lib/api';

const CarsMap = lazy(() => import('@/components/public/CarsMap').then((m) => ({ default: m.CarsMap })));

type Transmission = 'manual' | 'automatic';

type FilterState = {
  price: [number, number];
  cats: string[];
  brands: string[];
  trans: Transmission[];
  instant: boolean;
};

function FilterPanel({
  state,
  set,
  brands,
  categories,
  lang,
}: {
  state: FilterState;
  set: (s: FilterState) => void;
  brands: string[];
  categories: { id: string; name: string }[];
  lang: 'tr' | 'en' | 'ru';
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-sm mb-3">{t('cars.priceUnit')}</h4>
        <Slider min={300} max={3500} step={100} value={state.price} onValueChange={(v) => set({ ...state, price: [v[0], v[1]] as [number, number] })} />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>₺{state.price[0]}</span><span>₺{state.price[1]}</span>
        </div>
      </div>
      {categories.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-3">{t('cars.category')}</h4>
          <div className="space-y-2">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={state.cats.includes(c.id)}
                  onCheckedChange={(v) =>
                    set({ ...state, cats: v ? [...state.cats, c.id] : state.cats.filter((x) => x !== c.id) })
                  }
                />
                <span>{categoryName(c.id, lang, c.name)}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {brands.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-3">{t('cars.brand')}</h4>
          <div className="space-y-2 max-h-48 overflow-auto">
            {brands.map((b) => (
              <label key={b} className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={state.brands.includes(b)}
                  onCheckedChange={(v) =>
                    set({ ...state, brands: v ? [...state.brands, b] : state.brands.filter((x) => x !== b) })
                  }
                />
                <span>{b}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <div>
        <h4 className="font-semibold text-sm mb-3">{t('cars.transmission')}</h4>
        {(['automatic', 'manual'] as Transmission[]).map((tr) => (
          <label key={tr} className="flex items-center gap-2 cursor-pointer text-sm py-1">
            <Checkbox
              checked={state.trans.includes(tr)}
              onCheckedChange={(v) =>
                set({ ...state, trans: v ? [...state.trans, tr] : state.trans.filter((x) => x !== tr) })
              }
            />
            <span className="capitalize">{tr}</span>
          </label>
        ))}
      </div>
      <div>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <Checkbox checked={state.instant} onCheckedChange={(v) => set({ ...state, instant: !!v })} />
          <Zap className="h-3.5 w-3.5 text-success" />
          <span>{t('cars.instantOnly')}</span>
        </label>
      </div>
    </div>
  );
}

export default function Cars() {
  const { t, i18n } = useTranslation();
  const [params] = useSearchParams();
  const cityFilter = params.get('city');
  const catFilter = params.get('category');
  const lang = (i18n.language?.slice(0, 2) === 'ru' ? 'ru' : i18n.language?.slice(0, 2) === 'en' ? 'en' : 'tr') as 'tr' | 'en' | 'ru';

  const [state, setState] = useState<FilterState>({
    price: [300, 3500],
    cats: catFilter ? [catFilter] : [],
    brands: [] as string[],
    trans: [] as Transmission[],
    instant: false,
  });
  const [sort, setSort] = useState<'price-asc' | 'price-desc' | 'rating' | 'newest'>('rating');
  const [view, setView] = useState<'list' | 'map'>('list');

  const apiQuery = usePublicCars({ city: cityFilter ?? undefined, limit: 60 });
  const cars: ApiCar[] = apiQuery.data?.data ?? [];
  const total = apiQuery.data?.meta?.total ?? cars.length;

  const categoriesQ = useCategories();
  const categories = categoriesQ.data ?? [];

  const brands = useMemo(() => {
    const set = new Set<string>();
    cars.forEach((c) => set.add(c.brand));
    return Array.from(set).sort();
  }, [cars]);

  const filtered = useMemo(() => {
    let r = cars.filter(
      (c) =>
        c.price_per_day >= state.price[0] &&
        c.price_per_day <= state.price[1] &&
        (state.cats.length === 0 || state.cats.includes(c.category)) &&
        (state.brands.length === 0 || state.brands.includes(c.brand)) &&
        (state.trans.length === 0 || state.trans.includes(c.transmission)) &&
        (!state.instant || c.instant_book) &&
        (!cityFilter || c.city === cityFilter)
    );
    if (sort === 'price-asc') r = [...r].sort((a, b) => a.price_per_day - b.price_per_day);
    if (sort === 'price-desc') r = [...r].sort((a, b) => b.price_per_day - a.price_per_day);
    if (sort === 'rating') r = [...r].sort((a, b) => b.rating_avg - a.rating_avg);
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
          <Card className="p-5 sticky top-20">
            <FilterPanel state={state} set={setState} brands={brands} categories={categories} lang={lang} />
          </Card>
        </aside>
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="font-display text-2xl font-bold">{t('cars.totalCount', { count: filtered.length })}</h1>
              {cityFilter && <p className="text-sm text-muted-foreground">{t('cars.inCity', { city: cityFilter })}</p>}
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border bg-background p-0.5">
                <Button
                  size="sm"
                  variant={view === 'list' ? 'default' : 'ghost'}
                  className={view === 'list' ? 'bg-gradient-brand text-white border-0 h-8' : 'h-8'}
                  onClick={() => setView('list')}
                >
                  <List className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">{t('cars.view.list')}</span>
                </Button>
                <Button
                  size="sm"
                  variant={view === 'map' ? 'default' : 'ghost'}
                  className={view === 'map' ? 'bg-gradient-brand text-white border-0 h-8' : 'h-8'}
                  onClick={() => setView('map')}
                >
                  <MapIcon className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">{t('cars.view.map')}</span>
                </Button>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4 mr-1.5" /> {t('cars.filters')}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-auto">
                  <div className="mt-6">
                    <FilterPanel state={state} set={setState} brands={brands} categories={categories} lang={lang} />
                  </div>
                </SheetContent>
              </Sheet>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="h-9 rounded-lg border bg-background px-3 text-sm"
              >
                <option value="rating">{t('cars.sort.topRated')}</option>
                <option value="price-asc">{t('cars.sort.priceAsc')}</option>
                <option value="price-desc">{t('cars.sort.priceDesc')}</option>
                <option value="newest">{t('cars.sort.newest')}</option>
              </select>
            </div>
          </div>
          {apiQuery.isLoading ? (
            <Card className="p-16 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('common.loadingCars')}
            </Card>
          ) : total === 0 ? (
            <Card className="p-16 text-center">
              <h2 className="font-display font-bold text-xl mb-2">{t('cars.noCarsTitle')}</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
                {cityFilter
                  ? t('cars.noCarsDesc', { city: cityFilter })
                  : t('cars.noCarsDescGeneric')}
              </p>
              <Button asChild className="bg-gradient-brand text-white border-0">
                <Link to="/register-company">{t('cars.registerYourCompany')}</Link>
              </Button>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="p-16 text-center text-muted-foreground">{t('cars.noResults')}</Card>
          ) : view === 'map' ? (
            <Suspense fallback={
              <Card className="p-16 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> {t('common.loadingCars')}
              </Card>
            }>
              <CarsMap cars={filtered} />
            </Suspense>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((c) => <CarCard key={c.id} car={c} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
