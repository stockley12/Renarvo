import { create } from 'zustand';
import type { ApiUser } from '@/lib/api';

interface SessionState {
  user: ApiUser | null;
  loading: boolean;
  setUser: (u: ApiUser | null) => void;
  setLoading: (b: boolean) => void;
  clear: () => void;
}

export const useSession = create<SessionState>()((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  clear: () => set({ user: null }),
}));

export function selectIsAuthenticated(s: SessionState) {
  return s.user !== null;
}

export function selectIsCompanyUser(s: SessionState) {
  return s.user?.role === 'company_owner' || s.user?.role === 'company_staff';
}

export function selectIsAdmin(s: SessionState) {
  return s.user?.role === 'superadmin';
}
