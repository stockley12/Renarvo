import { useQuery } from '@tanstack/react-query';
import { api, type ApiCar, type Paginated } from '@/lib/api';

export function usePublicCars(filters: Record<string, string | number | boolean | undefined> = {}) {
  return useQuery<Paginated<ApiCar> | ApiCar[]>({
    queryKey: ['public-cars', filters],
    queryFn: () => api.get<Paginated<ApiCar> | ApiCar[]>('/cars', filters),
    staleTime: 60_000,
  });
}

export function usePublicCar(id: string | number | undefined) {
  return useQuery<ApiCar>({
    queryKey: ['public-car', id],
    queryFn: () => api.get<ApiCar>(`/cars/${id}`),
    enabled: id !== undefined && id !== '',
    staleTime: 60_000,
  });
}
