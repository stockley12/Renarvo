import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L, { type LatLngBoundsLiteral, type LatLngExpression } from 'leaflet';
import { Star } from 'lucide-react';
import type { ApiCar } from '@/lib/api';
import { useApp } from '@/store/app';
import { formatPrice } from '@/lib/format';
import { useTranslation } from 'react-i18next';

// City centroids for Northern Cyprus (rough — sufficient for v1; per-branch
// coordinates will replace these once Branches gets a coords field).
const CITY_COORDS: Record<string, [number, number]> = {
  'Girne': [35.3417, 33.3192],
  'Lefkoşa': [35.1856, 33.3823],
  'Lefkosia': [35.1856, 33.3823],
  'Nicosia': [35.1856, 33.3823],
  'Gazimağusa': [35.1264, 33.9389],
  'Famagusta': [35.1264, 33.9389],
  'Gaziveren': [35.2069, 32.8889],
  'Güzelyurt': [35.1989, 32.9986],
  'İskele': [35.2856, 33.8917],
  'Lapta': [35.3450, 33.1900],
  'Lefke': [35.1156, 32.8478],
  'Karpaz': [35.5500, 34.2500],
  'Karpaz Peninsula': [35.5500, 34.2500],
  'Esentepe': [35.3667, 33.5500],
  'Bafra': [35.3211, 33.9111],
};

const NC_CENTER: LatLngExpression = [35.25, 33.5];
const NC_BOUNDS: LatLngBoundsLiteral = [
  [34.9, 32.6],
  [35.7, 34.6],
];

// Fix Leaflet's default marker assets in Vite bundles
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export type MapCar = ApiCar;

function jitter(seed: number, range = 0.012): number {
  const s = Math.sin(seed * 9301 + 49297) * 233280;
  return ((s - Math.floor(s)) - 0.5) * 2 * range;
}

function FitBounds({ points }: { points: Array<{ lat: number; lng: number }> }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => L.latLng(p.lat, p.lng)));
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }, [map, points]);
  return null;
}

export function CarsMap({ cars }: { cars: MapCar[] }) {
  const { currency, locale } = useApp();
  const { t } = useTranslation();

  const points = useMemo(() => {
    return cars
      .map((car) => {
        const center = CITY_COORDS[car.city];
        if (!center) return null;
        const lat = center[0] + jitter(car.id);
        const lng = center[1] + jitter(car.id + 7);
        return { car, lat, lng };
      })
      .filter((p): p is { car: MapCar; lat: number; lng: number } => p !== null);
  }, [cars]);

  return (
    <div className="rounded-2xl overflow-hidden border border-border/60 shadow-card">
      <MapContainer
        center={NC_CENTER}
        zoom={9}
        maxBounds={NC_BOUNDS}
        scrollWheelZoom
        className="h-[60vh] sm:h-[70vh] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {points.map(({ car, lat, lng }) => (
          <Marker key={car.id} position={[lat, lng]}>
            <Popup minWidth={220}>
              <div className="space-y-1">
                <div className="font-semibold text-sm">{car.brand} {car.model}</div>
                <div className="text-xs text-muted-foreground">{car.year} • {car.city}</div>
                {car.rating_avg > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    {Number(car.rating_avg).toFixed(1)}
                    {car.review_count ? ` (${car.review_count})` : ''}
                  </div>
                )}
                <div className="text-sm font-bold text-primary pt-1">
                  {formatPrice(car.price_per_day, currency, locale)} <span className="text-[10px] text-muted-foreground font-normal">/ {t('cars.perDay').replace(/^\W*/, '')}</span>
                </div>
                <Link
                  to={`/cars/${car.id}`}
                  className="block w-full text-center text-xs font-semibold text-white bg-gradient-brand rounded-lg py-1.5 mt-2 no-underline"
                >
                  {t('cars.bookNow')}
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
