import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Star, Users, Fuel, Settings2, MapPin, Calendar, Shield, Check, X, ArrowLeft, Loader2,
  Snowflake, Gauge, GraduationCap, IdCard,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CarImage } from '@/components/brand/CarImage';
import { CarCard } from '@/components/public/CarCard';
import { useApp } from '@/store/app';
import { formatPrice, storageUrl } from '@/lib/format';
import { usePublicCar, usePublicCars } from '@/lib/hooks/useCars';

export default function CarDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { currency, locale } = useApp();
  const navigate = useNavigate();

  const carQ = usePublicCar(id);
  const car = carQ.data;
  const similarQ = usePublicCars({ limit: 8, category: car?.category });

  if (carQ.isLoading) {
    return (
      <div className="container py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> {t('carDetail.loading')}
      </div>
    );
  }
  if (carQ.isError || !car) {
    return (
      <div className="container py-20 text-center">
        {t('carDetail.notFound')} <Link to="/cars" className="text-primary">{t('carDetail.browseCars')}</Link>
      </div>
    );
  }

  const company = car.company;
  const seed = car.image_seed || `${car.brand}-${car.model}-${car.id}`;
  const features = car.features ?? [];
  const similar = (similarQ.data?.data ?? []).filter((c) => c.id !== car.id).slice(0, 4);
  const images = (car.images ?? [])
    .map((img) => storageUrl(img.path))
    .filter((u): u is string => !!u);
  const heroUrl = images[0] ?? null;
  const thumbs = images.slice(1, 5);

  const minDriverAge = car.min_driver_age_override ?? car.min_driver_age ?? company?.min_driver_age_default ?? null;
  const kmPolicy = company?.kilometre_policy;
  const kmLimit = car.kilometre_limit_per_day ?? company?.kilometre_limit_per_day_default ?? null;

  return (
    <div className="container py-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> {t('common.back')}
      </Button>
      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <div>
          <CarGallery seed={seed} hero={heroUrl} thumbs={thumbs} />


          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-extrabold">{car.brand} {car.model}</h1>
              <p className="text-muted-foreground mt-1">{car.year} • {car.category}</p>
            </div>
            {car.rating_avg > 0 && (
              <Badge className="bg-warning/15 text-warning border-warning/30 text-sm">
                <Star className="h-3.5 w-3.5 mr-1 fill-warning" /> {Number(car.rating_avg).toFixed(1)} ({car.review_count})
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
            {[
              { icon: Users, label: t('carDetail.seats', { count: car.seats }) },
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

          {(car.engine_power_hp || car.engine_cc || car.has_ac !== undefined || minDriverAge || kmPolicy || company?.student_friendly) && (
            <Card className="p-6 mb-5">
              <h3 className="font-display font-bold text-lg mb-3">{t('carDetail.specs')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {(car.engine_power_hp || car.engine_cc) && (
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-primary" />
                    <span>
                      {t('carDetail.engine')}:&nbsp;
                      {car.engine_power_hp ? t('carDetail.engineHp', { hp: car.engine_power_hp }) : ''}
                      {car.engine_power_hp && car.engine_cc ? ' • ' : ''}
                      {car.engine_cc ? t('carDetail.engineCc', { cc: car.engine_cc }) : ''}
                    </span>
                  </div>
                )}
                {car.has_ac !== undefined && (
                  <div className="flex items-center gap-2">
                    <Snowflake className={car.has_ac ? 'h-4 w-4 text-primary' : 'h-4 w-4 text-muted-foreground'} />
                    <span>{car.has_ac ? t('carDetail.acYes') : t('carDetail.acNo')}</span>
                  </div>
                )}
                {minDriverAge && (
                  <div className="flex items-center gap-2">
                    <IdCard className="h-4 w-4 text-primary" />
                    <span>{t('carDetail.minAge', { age: minDriverAge })}</span>
                  </div>
                )}
                {kmPolicy === 'unlimited' ? (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    <span>{t('carDetail.kmUnlimited')}</span>
                  </div>
                ) : kmLimit ? (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    <span>{t('carDetail.kmLimit', { km: kmLimit })}</span>
                  </div>
                ) : null}
                {company?.student_friendly && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span>{t('carDetail.studentFriendly')}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {features.length > 0 && (
            <Card className="p-6 mb-5">
              <h3 className="font-display font-bold text-lg mb-3">{t('carDetail.features')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" /> {f}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6 mb-5">
            <h3 className="font-display font-bold text-lg mb-3">{t('carDetail.includedAndPolicy')}</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2"><Check className="h-4 w-4 text-success mt-0.5" /> {t('carDetail.basicInsurance')}</li>
              {car.mileage_policy && (
                <li className="flex gap-2"><Check className="h-4 w-4 text-success mt-0.5" /> {car.mileage_policy}</li>
              )}
              {company?.roadside_24_7 && (
                <li className="flex gap-2"><Check className="h-4 w-4 text-success mt-0.5" /> {t('carDetail.roadside247')}</li>
              )}
              <li className="flex gap-2"><X className="h-4 w-4 text-destructive mt-0.5" /> {t('carDetail.fuelExcluded')}</li>
              {Number(car.deposit) > 0 && (
                <li className="flex gap-2"><Shield className="h-4 w-4 text-primary mt-0.5" /> {t('carDetail.deposit', { amount: Number(car.deposit).toLocaleString() })}</li>
              )}
            </ul>
          </Card>

          {company && (
            <Card className="p-6 flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 bg-gradient-brand">
                {company.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{company.name}</div>
                <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {company.rating_avg > 0 && (
                    <>
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      {Number(company.rating_avg).toFixed(1)} ·{' '}
                    </>
                  )}
                  {t('carDetail.respondsWithin1h')}
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to={`/companies/${company.slug}`}>{t('common.view')}</Link>
              </Button>
            </Card>
          )}
        </div>

        {/* Booking sidebar */}
        <div>
          <Card className="p-6 sticky top-20 shadow-elevated">
            <div className="flex items-end gap-2 mb-4">
              <span className="text-3xl font-display font-extrabold text-primary">{formatPrice(car.price_per_day, currency, locale)}</span>
              <span className="text-sm text-muted-foreground mb-1">{t('cars.perDay')}</span>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t('carDetail.daysCalc', { days: 3, price: formatPrice(car.price_per_day, currency, locale) })}</span><span className="font-semibold">{formatPrice(car.price_per_day * 3, currency, locale)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('carDetail.serviceFee')}</span><span className="font-semibold">{formatPrice(120, currency, locale)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('carDetail.taxKdv')}</span><span className="font-semibold">{formatPrice(car.price_per_day * 3 * 0.18, currency, locale)}</span></div>
              <Separator />
              <div className="flex justify-between text-base font-bold"><span>{t('carDetail.total')}</span><span>{formatPrice(car.price_per_day * 3 * 1.18 + 120, currency, locale)}</span></div>
            </div>
            <Button asChild size="lg" className="w-full mt-5 bg-gradient-brand text-white border-0">
              <Link to={`/book/${car.id}`}><Calendar className="h-4 w-4 mr-2" /> {t('cars.bookNow')}</Link>
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">{t('carDetail.freeCancellation')}</p>
          </Card>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold mb-5">{t('carDetail.similarCars')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {similar.map((c) => <CarCard key={c.id} car={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function CarGallery({ seed, hero, thumbs }: { seed: string; hero: string | null; thumbs: string[] }) {
  const [active, setActive] = useState<string | null>(hero);
  const all = hero ? [hero, ...thumbs] : [];
  const current = active ?? hero;

  if (all.length === 0) {
    return (
      <>
        <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-3 shadow-card">
          <CarImage seed={seed} />
        </div>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden">
              <CarImage seed={`${seed}-${i}`} />
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-3 shadow-card bg-muted">
        {current && (
          <img src={current} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      {all.length > 1 && (
        <div className="grid grid-cols-4 gap-2 mb-6">
          {all.slice(0, 8).map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => setActive(url)}
              className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-colors ${
                current === url ? 'border-primary' : 'border-transparent hover:border-border'
              }`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
