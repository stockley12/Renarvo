/**
 * Renarvo API client.
 *
 * - Stores access token in memory only (never localStorage).
 * - Refresh token lives in httpOnly cookie set by the backend.
 * - On 401 it transparently calls /auth/refresh once, retries the original request, then
 *   surfaces a logout event if refresh fails.
 */

import { tokenStore } from './tokenStore';

const API_BASE = (import.meta.env.VITE_API_URL ?? '/api/v1').replace(/\/$/, '');

export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  status: number;
};

export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(err: ApiError) {
    super(err.message);
    this.name = 'ApiClientError';
    this.status = err.status;
    this.code = err.code;
    this.details = err.details;
  }
}

type FetchOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined | null>;
  json?: unknown;
  idempotencyKey?: string;
  skipAuthRefresh?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

function buildUrl(path: string, query?: FetchOptions['query']): string {
  const url = new URL(API_BASE + path, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

async function refreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return false;
      const body = await res.json();
      if (body?.data?.access_token) {
        tokenStore.set(body.data.access_token);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { json, query, idempotencyKey, skipAuthRefresh, headers, ...rest } = opts;

  const finalHeaders = new Headers(headers ?? {});
  finalHeaders.set('Accept', 'application/json');
  if (json !== undefined) finalHeaders.set('Content-Type', 'application/json');
  if (idempotencyKey) finalHeaders.set('Idempotency-Key', idempotencyKey);
  const access = tokenStore.get();
  if (access) finalHeaders.set('Authorization', `Bearer ${access}`);

  const init: RequestInit = {
    credentials: 'include',
    ...rest,
    headers: finalHeaders,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  };

  let res = await fetch(buildUrl(path, query), init);

  if (res.status === 401 && !skipAuthRefresh && access) {
    const refreshed = await refreshToken();
    if (refreshed) {
      finalHeaders.set('Authorization', `Bearer ${tokenStore.get()}`);
      res = await fetch(buildUrl(path, query), { ...init, headers: finalHeaders });
    } else {
      tokenStore.clear();
      window.dispatchEvent(new CustomEvent('renarvo:logout'));
    }
  }

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  if (!res.ok) {
    const err = (body as { error?: ApiError })?.error ?? {
      code: 'UNKNOWN',
      message: res.statusText || 'Request failed',
    };
    throw new ApiClientError({ ...err, status: res.status });
  }

  if (body && typeof body === 'object' && 'data' in (body as object) && 'meta' in (body as object)) {
    return body as T;
  }
  return ((body as { data?: T })?.data ?? (body as T));
}

export const api = {
  get: <T>(path: string, query?: FetchOptions['query']) =>
    request<T>(path, { method: 'GET', query }),
  post: <T>(path: string, json?: unknown, opts: Omit<FetchOptions, 'json'> = {}) =>
    request<T>(path, { method: 'POST', json, ...opts }),
  patch: <T>(path: string, json?: unknown, opts: Omit<FetchOptions, 'json'> = {}) =>
    request<T>(path, { method: 'PATCH', json, ...opts }),
  put: <T>(path: string, json?: unknown, opts: Omit<FetchOptions, 'json'> = {}) =>
    request<T>(path, { method: 'PUT', json, ...opts }),
  delete: <T>(path: string, opts: Omit<FetchOptions, 'json'> = {}) =>
    request<T>(path, { method: 'DELETE', ...opts }),
};

// Auth helpers (these don't go through the access-token path / refresh)
export async function login(email: string, password: string) {
  const data = await request<{ access_token: string; expires_in: number; user: ApiUser }>(
    '/auth/login',
    { method: 'POST', json: { email, password }, skipAuthRefresh: true }
  );
  tokenStore.set(data.access_token);
  return data;
}

export async function register(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  locale?: 'tr' | 'en' | 'ru';
}) {
  const data = await request<{ access_token: string; user: ApiUser }>('/auth/register', {
    method: 'POST',
    json: input,
    skipAuthRefresh: true,
  });
  tokenStore.set(data.access_token);
  return data;
}

export async function registerCompany(input: {
  company_name: string;
  city: string;
  phone: string;
  tax_number?: string;
  address?: string;
  owner_name: string;
  owner_email: string;
  owner_password: string;
}) {
  const data = await request<{ access_token: string; user: ApiUser; company: ApiCompanyMini }>(
    '/auth/register-company',
    { method: 'POST', json: input, skipAuthRefresh: true }
  );
  tokenStore.set(data.access_token);
  return data;
}

export async function logout() {
  try {
    await request('/auth/logout', { method: 'POST' });
  } finally {
    tokenStore.clear();
  }
}

export async function fetchMe() {
  return request<ApiUser>('/me', { method: 'GET' });
}

// ----- Types mirroring backend resources -----

export type ApiUser = {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  role: 'customer' | 'company_owner' | 'company_staff' | 'superadmin';
  locale: 'tr' | 'en' | 'ru';
  status: 'active' | 'banned';
  email_verified_at?: string | null;
  company_id?: number | null;
};

export type ApiCompanyMini = {
  id: number;
  slug: string;
  name: string;
  status: string;
};

export type ApiCar = {
  id: number;
  company_id: number;
  brand: string;
  model: string;
  name: string;
  year: number;
  category: string;
  transmission: 'manual' | 'automatic';
  fuel: string;
  seats: number;
  doors: number;
  price_per_day: number;
  weekly_price?: number | null;
  city: string;
  deposit: number;
  mileage_policy?: string | null;
  instant_book: boolean;
  status: string;
  description?: string | null;
  rating_avg: number;
  review_count: number;
  features?: string[];
  image_seed?: string | null;
  company?: { id: number; slug: string; name: string; rating_avg: number };
};

export type ApiCompany = {
  id: number;
  slug: string;
  name: string;
  city: string;
  description?: string | null;
  logo_color?: string | null;
  status: string;
  founded_year?: number | null;
  rating_avg: number;
  review_count: number;
  fleet_size: number;
};

export type ApiReservation = {
  id: number;
  code: string;
  car_id: number;
  company_id: number;
  customer_id: number;
  pickup_at: string;
  return_at: string;
  pickup_location: string;
  days: number;
  status: string;
  price: {
    base: number;
    extras: number;
    discount: number;
    service_fee: number;
    tax: number;
    total: number;
    currency: string;
  };
  car?: { id: number; brand: string; model: string; image_seed?: string | null };
  company?: { id: number; name: string; slug: string; phone?: string };
  customer?: { id: number; name: string; email: string; phone?: string | null };
  promo_code?: string | null;
  flight_number?: string | null;
  notes?: string | null;
  cancellation_reason?: string | null;
  return_location?: string | null;
  actual_return_at?: string | null;
  created_at?: string;
  extras?: Array<{ type: string; label: string; price_per_day: number }>;
};

export type Paginated<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; has_next: boolean };
};
