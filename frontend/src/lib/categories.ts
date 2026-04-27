/**
 * Static UI metadata for car categories.
 *
 * The canonical list of category IDs comes from `GET /api/v1/categories`.
 * This file only adds presentation hints (icon name) and the i18n fallback
 * label per locale; if the API returns a category ID we don't recognise we
 * fall back to a generic Car icon and use the API-provided name.
 */
export type CategoryMeta = {
  icon: string;
  nameTr: string;
  nameEn: string;
  nameRu: string;
};

export const CATEGORY_META: Record<string, CategoryMeta> = {
  economy:  { icon: 'Car',      nameTr: 'Ekonomik',   nameEn: 'Economy',  nameRu: 'Эконом' },
  compact:  { icon: 'CarFront', nameTr: 'Kompakt',    nameEn: 'Compact',  nameRu: 'Компакт' },
  suv:      { icon: 'Truck',    nameTr: 'SUV',        nameEn: 'SUV',      nameRu: 'Внедорожник' },
  luxury:   { icon: 'Gem',      nameTr: 'Lüks',       nameEn: 'Luxury',   nameRu: 'Премиум' },
  van:      { icon: 'Bus',      nameTr: 'Minivan',    nameEn: 'Van',      nameRu: 'Минивэн' },
  electric: { icon: 'Zap',      nameTr: 'Elektrikli', nameEn: 'Electric', nameRu: 'Электро' },
};

export function categoryName(id: string, lang: 'tr' | 'en' | 'ru', fallback?: string) {
  const meta = CATEGORY_META[id];
  if (!meta) return fallback ?? id;
  if (lang === 'tr') return meta.nameTr;
  if (lang === 'ru') return meta.nameRu;
  return meta.nameEn;
}

export function categoryIcon(id: string): string {
  return CATEGORY_META[id]?.icon ?? 'Car';
}
