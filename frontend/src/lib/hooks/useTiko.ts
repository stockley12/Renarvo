import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type TikoConfig = {
  mode: 'disabled' | 'sandbox' | 'live';
  enabled: boolean;
  currency: string;
};

export type TikoCheckoutResult = {
  method: 'pay3d_redirect';
  action_url: string;
  fields: Record<string, string>;
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

/**
 * Submit a pay3d form by creating a hidden form and auto-submitting it.
 * This redirects the user's browser to TIKO's 3DS page.
 */
export function submitPay3dForm(actionUrl: string, fields: Record<string, string>) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = actionUrl;
  form.style.display = 'none';

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
