import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type TikoConfig = {
  mode: 'disabled' | 'sandbox' | 'live';
  enabled: boolean;
  currency: string;
};

export type TikoCheckoutResult = {
  iframe_url: string;
  order_id: string;
  payment_id: number;
  reservation_id: number;
  amount_try: number;
  mode: TikoConfig['mode'];
};

export function useTikoConfig() {
  return useQuery<TikoConfig>({
    queryKey: ['tiko', 'config'],
    queryFn: () => api.get<TikoConfig>('/payments/tiko/config'),
    staleTime: 5 * 60_000,
  });
}

export function useTikoCheckout() {
  return useMutation<TikoCheckoutResult, Error, { reservationId: number }>({
    mutationFn: ({ reservationId }) =>
      api.post<TikoCheckoutResult>(`/me/reservations/${reservationId}/checkout/tiko`),
  });
}
