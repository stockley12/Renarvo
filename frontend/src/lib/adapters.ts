import type { Car as MockCar, CarCategory, Transmission, Fuel, CarStatus } from '@/mock/data';
import type { ApiCar, ApiCompany, Paginated } from '@/lib/api';

const KNOWN_CATEGORIES: ReadonlySet<string> = new Set(['economy', 'compact', 'suv', 'luxury', 'van', 'electric']);
const KNOWN_FUELS: ReadonlySet<string> = new Set(['petrol', 'diesel', 'hybrid', 'electric']);

/**
 * Convert a backend `ApiCar` into the legacy mock `Car` shape so existing UI
 * components (CarCard, CarDetail) can render it without a rewrite.
 *
 * The backend uses snake_case + numeric ids; the UI expects camelCase + string ids.
 */
export function apiCarToCar(c: ApiCar): MockCar {
  return {
    id: String(c.id),
    companyId: String(c.company_id),
    brand: c.brand,
    model: c.model,
    year: c.year,
    category: (KNOWN_CATEGORIES.has(c.category) ? c.category : 'economy') as CarCategory,
    transmission: c.transmission as Transmission,
    fuel: (KNOWN_FUELS.has(c.fuel) ? c.fuel : 'petrol') as Fuel,
    seats: c.seats ?? 5,
    doors: c.doors ?? 4,
    pricePerDay: Number(c.price_per_day) || 0,
    city: c.city,
    rating: Number(c.rating_avg) || 0,
    reviewCount: c.review_count ?? 0,
    features: Array.isArray(c.features) ? c.features : [],
    image: c.image_seed ?? `${c.brand}-${c.model}-${c.id}`,
    status: (c.status as CarStatus) ?? 'active',
    plate: '',
    deposit: Number(c.deposit) || 0,
    mileagePolicy: c.mileage_policy ?? 'Unlimited',
    instantBook: !!c.instant_book,
  };
}

export function unwrapCars(payload: Paginated<ApiCar> | ApiCar[] | undefined | null): ApiCar[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.data) ? payload.data : [];
}

export function apiCompanyMini(c: ApiCompany | NonNullable<ApiCar['company']>): {
  id: string;
  slug: string;
  name: string;
  logoColor: string;
  rating: number;
  reviewCount: number;
} {
  return {
    id: String(c.id),
    slug: c.slug,
    name: c.name,
    logoColor: 'logo_color' in c && c.logo_color ? c.logo_color : '230 60% 60%',
    rating: 'rating_avg' in c ? Number(c.rating_avg) || 0 : 0,
    reviewCount: 'review_count' in c ? c.review_count ?? 0 : 0,
  };
}
