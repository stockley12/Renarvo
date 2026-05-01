import { useQuery } from '@tanstack/react-query';
import { api, type ApiCar, type Paginated } from '@/lib/api';

export function usePublicCars(filters: Record<string, string | number | boolean | undefined> = {}) {
  return useQuery<Paginated<ApiCar>>({
    queryKey: ['public-cars', filters],
    queryFn: () => api.get<Paginated<ApiCar>>('/cars', filters),
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

export type PublicCompanyExtra = {
  id: number;
  code: string;
  name: string;
  price_per_day: number;
  price_per_rental: number;
  charge_mode: 'per_day' | 'per_rental' | 'free';
  description: string | null;
};

export type PublicInsurancePackage = {
  id: number;
  tier: 'mini' | 'mid' | 'full';
  name: string;
  price_per_day: number;
  deductible_amount: number | null;
  coverage_amount: number | null;
  description: string | null;
  included_features: string[];
};

export function usePublicCompanyExtras(companyId: number | undefined) {
  return useQuery<PublicCompanyExtra[]>({
    queryKey: ['public-company-extras', companyId],
    queryFn: () => api.get<PublicCompanyExtra[]>(`/companies/${companyId}/extras`),
    enabled: companyId !== undefined,
    staleTime: 5 * 60_000,
  });
}

export function usePublicCompanyInsurance(companyId: number | undefined) {
  return useQuery<PublicInsurancePackage[]>({
    queryKey: ['public-company-insurance', companyId],
    queryFn: () => api.get<PublicInsurancePackage[]>(`/companies/${companyId}/insurance-packages`),
    enabled: companyId !== undefined,
    staleTime: 5 * 60_000,
  });
}
