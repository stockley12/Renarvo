import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, Users, Fuel, Settings2, MapPin, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CarImage } from '@/components/brand/CarImage';
import { useApp } from '@/store/app';
import { formatPrice } from '@/lib/format';
import type { ApiCar } from '@/lib/api';

type Props = { car: ApiCar };

export function CarCard({ car }: Props) {
  const { t } = useTranslation();
  const { currency, locale } = useApp();
  const seed = car.image_seed || `${car.brand}-${car.model}-${car.id}`;

  return (
    <Card className="group overflow-hidden hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 border-border/60">
      <Link to={`/cars/${car.id}`} className="block aspect-[16/10] relative overflow-hidden">
        <CarImage seed={seed} className="group-hover:scale-105 transition-transform duration-500" />
        {car.instant_book && (
          <Badge className="absolute top-3 left-3 bg-success text-success-foreground border-0 gap-1">
            <Zap className="h-3 w-3" /> Instant book
          </Badge>
        )}
        {car.rating_avg > 0 && (
          <Badge className="absolute top-3 right-3 bg-white/95 text-navy border-0 backdrop-blur gap-1">
            <Star className="h-3 w-3 fill-warning text-warning" /> {Number(car.rating_avg).toFixed(1)}
          </Badge>
        )}
      </Link>
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display font-bold text-lg leading-tight">{car.brand} {car.model}</h3>
              <p className="text-xs text-muted-foreground capitalize">{car.year} • {car.category}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Settings2 className="h-3 w-3" />{car.transmission}</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1"><Fuel className="h-3 w-3" />{car.fuel}</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{car.seats}</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{car.city}</span>
        </div>
        <div className="flex items-end justify-between pt-2 border-t">
          <div>
            <div className="text-xl font-display font-bold text-primary">{formatPrice(car.price_per_day, currency, locale)}</div>
            <div className="text-xs text-muted-foreground">{t('cars.perDay')}</div>
          </div>
          <Button asChild size="sm" className="bg-gradient-brand text-white border-0 hover:opacity-90">
            <Link to={`/cars/${car.id}`}>{t('cars.bookNow')}</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
