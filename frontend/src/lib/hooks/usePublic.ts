import { useQuery } from '@tanstack/react-query';
import { api, type ApiCompany, type Paginated } from '@/lib/api';

export function usePublicCompanies(filters: Record<string, string | number | boolean | undefined> = {}) {
  return useQuery<Paginated<ApiCompany>>({
    queryKey: ['public-companies', filters],
    queryFn: () => api.get<Paginated<ApiCompany>>('/companies', filters),
    staleTime: 60_000,
  });
}

export function usePublicCompany(slug: string | undefined) {
  return useQuery<ApiCompany>({
    queryKey: ['public-company', slug],
    queryFn: () => api.get<ApiCompany>(`/companies/${slug}`),
    enabled: !!slug,
    staleTime: 60_000,
  });
}

export function useCities() {
  return useQuery<string[]>({
    queryKey: ['lookups', 'cities'],
    queryFn: () => api.get<string[]>('/cities'),
    staleTime: 60 * 60_000,
  });
}

type Category = { id: string; name: string };

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['lookups', 'categories'],
    queryFn: () => api.get<Category[]>('/categories'),
    staleTime: 60 * 60_000,
  });
}

export function usePickupPoints() {
  return useQuery<string[]>({
    queryKey: ['lookups', 'pickup-points'],
    queryFn: () => api.get<string[]>('/pickup-points'),
    staleTime: 60 * 60_000,
  });
}
