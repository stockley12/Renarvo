import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiCar, type ApiReservation, type Paginated } from '../api';

type Overview = {
  stats: {
    reservations_today: number;
    reservations_pending: number;
    reservations_active: number;
    revenue_this_month: number;
    fleet_size: number;
  };
  recent_reservations: Array<{
    id: number;
    code: string;
    status: string;
    pickup_at: string;
    customer_name: string;
    car_label: string;
    total_price: number;
  }>;
};

export function useCompanyOverview() {
  return useQuery({
    queryKey: ['company', 'overview'],
    queryFn: () => api.get<Overview>('/company/overview'),
    staleTime: 60_000,
  });
}

export function useCompanyCalendar(from?: string, to?: string) {
  return useQuery({
    queryKey: ['company', 'calendar', from, to],
    queryFn: () =>
      api.get<Array<{
        id: number;
        code: string;
        car: string;
        start: string;
        end: string;
        status: string;
      }>>('/company/calendar', { from, to }),
  });
}

export function useCompanyStatistics() {
  return useQuery({
    queryKey: ['company', 'statistics'],
    queryFn: () =>
      api.get<{
        monthly: Array<{ month: string; bookings: number; revenue: number }>;
        top_cars: Array<{ car_id: number; bookings: number; revenue: number }>;
        status_breakdown: Record<string, number>;
      }>('/company/statistics'),
    staleTime: 5 * 60_000,
  });
}

export function useCompanyCars(query?: { status?: string; search?: string; page?: number }) {
  return useQuery({
    queryKey: ['company', 'cars', query],
    queryFn: () => api.get<Paginated<ApiCar>>('/company/cars', query),
  });
}

export function useCompanyReservations(query?: {
  status?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ['company', 'reservations', query],
    queryFn: () => api.get<Paginated<ApiReservation>>('/company/reservations', query),
  });
}

type LifecycleAction = 'confirm' | 'reject' | 'pickup' | 'return';

export function useReservationTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      reason,
    }: {
      id: number;
      action: LifecycleAction;
      reason?: string;
    }) =>
      api.patch<ApiReservation>(`/company/reservations/${id}/${action}`, reason ? { reason } : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company', 'reservations'] });
      qc.invalidateQueries({ queryKey: ['company', 'overview'] });
      qc.invalidateQueries({ queryKey: ['company', 'calendar'] });
    },
  });
}

export function useCompanyMessages() {
  return useQuery({
    queryKey: ['company', 'messages'],
    queryFn: () =>
      api.get<Array<{
        id: number;
        subject: string;
        last_message_at: string;
        unread_count: number;
        customer_name: string;
      }>>('/company/messages'),
  });
}

export function useCompanyReviews() {
  return useQuery({
    queryKey: ['company', 'reviews'],
    queryFn: () =>
      api.get<Array<{
        id: number;
        rating: number;
        comment: string;
        customer_name: string;
        car_label: string;
        reply: string | null;
        created_at: string;
      }>>('/company/reviews'),
  });
}

export function useCompanyPricing() {
  return useQuery({
    queryKey: ['company', 'pricing'],
    queryFn: () =>
      api.get<{
        seasonal: Array<{ id: number; name: string; start_date: string; end_date: string; adjustment_pct: number; active: boolean }>;
        length_discounts: Array<{ id: number; min_days: number; discount_pct: number }>;
      }>('/company/pricing'),
  });
}

export function useCompanyPromos() {
  return useQuery({
    queryKey: ['company', 'promos'],
    queryFn: () =>
      api.get<Array<{
        id: number;
        code: string;
        discount_type: 'percent' | 'fixed';
        discount_value: number;
        max_uses: number | null;
        used_count: number;
        expires_at: string | null;
        active: boolean;
      }>>('/company/promos'),
  });
}
