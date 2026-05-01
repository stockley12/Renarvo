import type { Currency, Locale } from '@/store/app';

const localeMap: Record<Locale, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  ru: 'ru-RU',
};

// Display-only conversion factors (mock, vs TRY base)
const rates: Record<Currency, number> = {
  TRY: 1,
  USD: 0.026,
  EUR: 0.024,
  RUB: 2.4,
};

const symbols: Record<Currency, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  RUB: '₽',
};

export function formatPrice(amountTRY: number, currency: Currency, locale: Locale = 'tr'): string {
  const value = amountTRY * rates[currency];
  try {
    return new Intl.NumberFormat(localeMap[locale], {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${symbols[currency]}${Math.round(value).toLocaleString()}`;
  }
}

export function formatNumber(n: number, locale: Locale = 'tr'): string {
  return new Intl.NumberFormat(localeMap[locale]).format(n);
}

export function formatDate(d: Date | string, locale: Locale = 'tr'): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat(localeMap[locale], {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(date);
}

export function storageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `/storage/${path.replace(/^\/+/, '')}`;
}
