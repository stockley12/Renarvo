import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

type FxRatesResponse = {
  base: string;
  rates: Record<string, number>;
  fetched_at: string | null;
};

export function useFxRates() {
  return useQuery<FxRatesResponse>({
    queryKey: ['fx-rates'],
    queryFn: () => api.get('/fx-rates'),
    staleTime: 60 * 60 * 1000,
  });
}
