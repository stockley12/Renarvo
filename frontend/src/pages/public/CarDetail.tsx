import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, Users, Fuel, Settings2, MapPin, Calendar, Shield, Check, X, ArrowLeft, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CarImage } from '@/components/brand/CarImage';
import { CarCard } from '@/components/public/CarCard';
import { cars as mockCars, companies as mockCompanies } from '@/mock/data';
import { useApp } from '@/store/app';
import { formatPrice } from '@/lib/format';
import { usePublicCar, usePublicCars } from '@/lib/hooks/useCars';
import { apiCarToCar, apiCompanyMini, unwrapCars } from '@/lib/adapters';

export default function CarDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { currency, locale } = useApp();
  const navigate = useNavigate();

  const apiCar = usePublicCar(id);
  const apiSimilar = usePublicCars({ limit: 8 });

  const car = useMemo(() => {
    if (apiCar.data) return apiCarToCar(apiCar.data);
    return mockCars.find(c => c.id === id) ?? null;
  }, [apiCar.data, id]);

  if (apiCar.isLoading && !car) {
    return (
      <div className="container py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading car…
      </div>
    );
  }
  if (!car) {
    return <div className="container py-20 text-center">Car not found. <Link to="/cars" className="text-primary">Browse cars</Link></div>;
  }

  const company = apiCar.data?.company
    ? apiCompanyMini(apiCar.data.company)
    : mockCompanies.find(c => c.id === car.companyId)
      ? {
          id: mockCompanies.find(c => c.id === car.companyId)!.id,
          slug: mockCompanies.find(c => c.id === car.companyId)!.slug,
          name: mockCompanies.find(c => c.id === car.companyId)!.name,
          logoColor: mockCompanies.find(c => c.id === car.companyId)!.logoColor,
          rating: mockCompanies.find(c => c.id === car.companyId)!.rating,
          reviewCount: mockCompanies.find(c => c.id === car.companyId)!.reviewCount,
        }
      : null;

  const apiSimilarList = unwrapCars(apiSimilar.data).map(apiCarToCar);
  const similarPool = apiSimilarList.length > 0 ? apiSimilarList : mockCars;
  const similar = similarPool.filter(c => c.id !== car.id && c.category === car.category).slice(0, 4);

  return (
    <div className="container py-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <div>
          <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-3 shadow-card">
            <CarImage seed={car.image} />
          </div>
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden">
                <CarImage seed={`${car.image}-${i}`} />
              </div>
            ))}
          </div>

          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-extrabold">{car.brand} {car.model}</h1>
              <p className="text-muted-foreground mt-1">{car.year} • {car.category}</p>
            </div>
            <Badge className="bg-warning/15 text-warning border-warning/30 text-sm">
              <Star className="h-3.5 w-3.5 mr-1 fill-warning" /> {car.rating.toFixed(1)} ({car.reviewCount})
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
            {[
              { icon: Users, label: `${car.seats} seats` },
              { icon: Settings2, label: car.transmission },
              { icon: Fuel, label: car.fuel },
              { icon: MapPin, label: car.city },
            ].map((s, i) => (
              <Card key={i} className="p-4 flex items-center gap-3">
                <s.icon className="h-5 w-5 text-primary" />
                <span className="capitalize text-sm font-medium">{s.label}</span>
              </Card>
            ))}
          </div>

          <Card className="p-6 mb-5">
            <h3 className="font-display font-bold text-lg mb-3">Features</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {car.features.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-success" /> {f}</div>
              ))}
            </div>
          </Card>

          <Card className="p-6 mb-5">
            <h3 className="font-display font-bold text-lg mb-3">Included & policy</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2"><Check className="h-4 w-4 text-success mt-0.5" /> Basic insurance</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-success mt-0.5" /> {car.mileagePolicy}</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-success mt-0.5" /> 24/7 roadside assistance</li>
              <li className="flex gap-2"><X className="h-4 w-4 text-destructive mt-0.5" /> Fuel</li>
              <li className="flex gap-2"><Shield className="h-4 w-4 text-primary mt-0.5" /> Deposit: ₺{car.deposit.toLocaleString()}</li>
            </ul>
          </Card>

          <Card className="p-6 flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
              style={{ background: `hsl(${company?.logoColor})` }}>
              {company?.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1">
              <div className="font-semibold">{company?.name}</div>
              <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-warning text-warning" />
                {company?.rating.toFixed(1)} · {company?.reviewCount} reviews · Responds within 1h
              </div>
            </div>
            <Button asChild variant="outline" size="sm"><Link to={`/companies/${company?.slug}`}>View</Link></Button>
          </Card>
        </div>

        {/* Booking sidebar */}
        <div>
          <Card className="p-6 sticky top-20 shadow-elevated">
            <div className="flex items-end gap-2 mb-4">
              <span className="text-3xl font-display font-extrabold text-primary">{formatPrice(car.pricePerDay, currency, locale)}</span>
              <span className="text-sm text-muted-foreground mb-1">{t('cars.perDay')}</span>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">3 days × {formatPrice(car.pricePerDay, currency, locale)}</span><span className="font-semibold">{formatPrice(car.pricePerDay * 3, currency, locale)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Service fee</span><span className="font-semibold">{formatPrice(120, currency, locale)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax (KDV)</span><span className="font-semibold">{formatPrice(car.pricePerDay * 3 * 0.18, currency, locale)}</span></div>
              <Separator />
              <div className="flex justify-between text-base font-bold"><span>Total</span><span>{formatPrice(car.pricePerDay * 3 * 1.18 + 120, currency, locale)}</span></div>
            </div>
            <Button asChild size="lg" className="w-full mt-5 bg-gradient-brand text-white border-0">
              <Link to={`/book/${car.id}`}><Calendar className="h-4 w-4 mr-2" /> {t('cars.bookNow')}</Link>
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">Free cancellation up to 48h before pickup</p>
          </Card>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold mb-5">Similar cars</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {similar.map(c => <CarCard key={c.id} car={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}
