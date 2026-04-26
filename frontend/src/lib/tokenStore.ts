/**
 * In-memory access-token store.
 *
 * Access tokens MUST NOT be persisted to localStorage (XSS risk). The refresh token
 * lives in an httpOnly cookie set by the backend, so reloads call /auth/refresh to
 * re-mint the access token.
 */

let accessToken: string | null = null;
const listeners = new Set<(t: string | null) => void>();

export const tokenStore = {
  get(): string | null {
    return accessToken;
  },
  set(token: string | null): void {
    accessToken = token;
    listeners.forEach((cb) => cb(token));
  },
  clear(): void {
    this.set(null);
  },
  subscribe(cb: (t: string | null) => void): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};
