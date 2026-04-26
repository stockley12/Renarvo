import { api, fetchMe, type ApiUser } from './api';
import { tokenStore } from './tokenStore';

export async function bootstrapSession(): Promise<ApiUser | null> {
  try {
    const res = await fetch(`${(import.meta.env.VITE_API_URL ?? '/api/v1').replace(/\/$/, '')}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const body = await res.json();
    if (body?.data?.access_token) {
      tokenStore.set(body.data.access_token);
      return body.data.user as ApiUser;
    }
    return null;
  } catch {
    return null;
  }
}

export async function bootstrapFxRates(): Promise<{ base: string; rates: Record<string, number>; fetched_at: string | null } | null> {
  try {
    return await api.get('/fx-rates');
  } catch {
    return null;
  }
}
