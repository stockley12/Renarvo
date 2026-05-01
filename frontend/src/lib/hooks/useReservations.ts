import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiReservation, type Paginated } from '@/lib/api';

type CreateReservationInput = {
  car_id: number;
  pickup_at: string;
  return_at: string;
  pickup_location: string;
  return_location?: string;
  flight_number?: string;
  driving_license_number?: string;
  date_of_birth?: string;
  notes?: string;
  promo_code?: string;
  insurance_package_id?: number | null;
  extra_ids?: number[];
  extras?: Array<{
    type: string;
    price_per_day: number;
    label?: string;
  }>;
};

export function useMyReservations(params: { status?: string } = {}) {
  return useQuery<Paginated<ApiReservation>>({
    queryKey: ['my-reservations', params],
    queryFn: () => api.get('/me/reservations', params),
  });
}

export function useReservation(id: number | string | undefined) {
  return useQuery<ApiReservation>({
    queryKey: ['my-reservation', id],
    queryFn: () => api.get<ApiReservation>(`/me/reservations/${id}`),
    enabled: id !== undefined && id !== '',
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation<ApiReservation, Error, CreateReservationInput>({
    mutationFn: (input) =>
      api.post<ApiReservation>('/me/reservations', input, {
        idempotencyKey: cryptoRandomKey(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-reservations'] });
    },
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation<ApiReservation, Error, { id: number; reason?: string }>({
    mutationFn: ({ id, reason }) =>
      api.patch<ApiReservation>(`/me/reservations/${id}/cancel`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-reservations'] });
    },
  });
}

function cryptoRandomKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now();
}
