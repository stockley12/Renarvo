import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiCar, type ApiCompany, type ApiReservation, type Paginated } from '../api';

/* -------------------- Overview / calendar / statistics -------------------- */

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
    customer_name: string | null;
    car_label: string | null;
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

export type CalendarEvent = {
  id: number;
  code: string;
  car: string | null;
  start: string;
  end: string;
  status: string;
};

export function useCompanyCalendar(from?: string, to?: string) {
  return useQuery({
    queryKey: ['company', 'calendar', from, to],
    queryFn: () => api.get<CalendarEvent[]>('/company/calendar', { from, to }),
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

/* -------------------- Cars -------------------- */

export function useCompanyCars(query?: { status?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['company', 'cars', query],
    queryFn: () => api.get<Paginated<ApiCar>>('/company/cars', query),
  });
}

export type CarPayload = {
  brand: string;
  model: string;
  year: number;
  category: 'economy' | 'compact' | 'suv' | 'luxury' | 'van' | 'electric';
  transmission: 'manual' | 'automatic';
  fuel: 'petrol' | 'diesel' | 'hybrid' | 'electric';
  seats: number;
  doors: number;
  price_per_day: number;
  weekly_price?: number | null;
  city: string;
  deposit?: number | null;
  mileage_policy?: string | null;
  instant_book?: boolean;
  status?: 'active' | 'draft' | 'maintenance' | 'hidden';
  plate?: string | null;
  vin?: string | null;
  description?: string | null;
  min_driver_age?: number | null;
  features?: string[];
  image_seed?: string | null;
};

export function useCreateCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CarPayload) => api.post<ApiCar>('/company/cars', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company', 'cars'] });
      qc.invalidateQueries({ queryKey: ['company', 'overview'] });
    },
  });
}

export function useUpdateCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CarPayload> }) =>
      api.patch<ApiCar>(`/company/cars/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company', 'cars'] });
    },
  });
}

export function useDeleteCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/company/cars/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company', 'cars'] });
      qc.invalidateQueries({ queryKey: ['company', 'overview'] });
    },
  });
}

export async function uploadCarImage(carId: number, file: File): Promise<{ id: number; path: string; position: number }> {
  const fd = new FormData();
  fd.append('image', file);
  const url = `/api/v1/company/cars/${carId}/images`;
  const headers = new Headers({ Accept: 'application/json' });
  const access = (await import('@/lib/tokenStore')).tokenStore.get();
  if (access) headers.set('Authorization', `Bearer ${access}`);
  const res = await fetch(url, { method: 'POST', headers, body: fd, credentials: 'include' });
  if (!res.ok) {
    const text = await res.text();
    let message = res.statusText;
    try {
      const body = JSON.parse(text);
      message = body?.error?.message ?? message;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  const json = await res.json();
  return json.data;
}

export function useDeleteCarImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ carId, imageId }: { carId: number; imageId: number }) =>
      api.delete(`/company/cars/${carId}/images/${imageId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', 'cars'] }),
  });
}

/* -------------------- Reservations -------------------- */

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
    mutationFn: ({ id, action, reason }: { id: number; action: LifecycleAction; reason?: string }) =>
      api.patch<ApiReservation>(`/company/reservations/${id}/${action}`, reason ? { reason } : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company', 'reservations'] });
      qc.invalidateQueries({ queryKey: ['company', 'overview'] });
      qc.invalidateQueries({ queryKey: ['company', 'calendar'] });
    },
  });
}

/* -------------------- Customers -------------------- */

export type CompanyCustomer = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  total_bookings: number;
  total_spent: number;
  last_booking: string | null;
};

export function useCompanyCustomers(query?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['company', 'customers', query],
    queryFn: () => api.get<Paginated<CompanyCustomer>>('/company/customers', query),
  });
}

/* -------------------- Branches -------------------- */

export type Branch = {
  id: number;
  name: string;
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: Record<string, string> | null;
};

export function useCompanyBranches() {
  return useQuery({
    queryKey: ['company', 'branches'],
    queryFn: () => api.get<Branch[]>('/company/branches'),
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Branch, 'id'>) => api.post<Branch>('/company/branches', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', 'branches'] }),
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<Branch> }) =>
      api.patch<Branch>(`/company/branches/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', 'branches'] }),
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/company/branches/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', 'branches'] }),
  });
}

/* -------------------- Staff -------------------- */

export type CompanyStaff = {
  id: number;
  company_id: number;
  user_id: number;
  role: 'manager' | 'agent';
  invited_at: string | null;
  user?: { id: number; name: string; email: string; phone?: string | null; status: string };
};

export function useCompanyStaff() {
  return useQuery({
    queryKey: ['company', 'staff'],
    queryFn: () => api.get<CompanyStaff[]>('/company/staff'),
  });
}

export function useInviteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; email: string; role: 'manager' | 'agent' }) =>
      api.post<CompanyStaff>('/company/staff', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', 'staff'] }),
  });
}

export function useRemoveStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/company/staff/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', 'staff'] }),
  });
}

/* -------------------- Reviews -------------------- */

export type CompanyReview = {
  id: number;
  rating: number;
  comment: string;
  customer?: { id: number; name: string };
  car?: { id: number; brand: string; model: string };
  company_reply: string | null;
  company_replied_at: string | null;
  created_at: string;
};

export function useCompanyReviews() {
  return useQuery({
    queryKey: ['company', 'reviews'],
    queryFn: () => api.get<Paginated<CompanyReview>>('/company/reviews'),
  });
}

export function useReplyReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) =>
      api.post<CompanyReview>(`/company/reviews/${id}/reply`, { text }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', 'reviews'] }),
  });
}

/* -------------------- Pricing & promos -------------------- */

export type CompanyPricing = {
  seasonal: Array<{ id: number; name: string; start_date: string; end_date: string; adjustment_pct: number; active: boolean }>;
  length_discounts: Array<{ id: number; min_days: number; discount_pct: number }>;
};

export function useCompanyPricing() {
  return useQuery({
    queryKey: ['company', 'pricing'],
    queryFn: () => api.get<CompanyPricing>('/company/pricing'),
  });
}

export function useUpdatePricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CompanyPricing>) => api.put<CompanyPricing>('/company/pricing', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', 'pricing'] }),
  });
}

export type Promo = {
  id: number;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
};

export function useCompanyPromos() {
  return useQuery({
    queryKey: ['company', 'promos'],
    queryFn: () => api.get<Promo[]>('/company/promos'),
  });
}

export function useCreatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      code: string;
      discount_type: 'percent' | 'fixed';
      discount_value: number;
      max_uses?: number | null;
      expires_at?: string | null;
      active?: boolean;
    }) => api.post<Promo>('/company/promos', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', 'promos'] }),
  });
}

export function useUpdatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<Promo> }) =>
      api.patch<Promo>(`/company/promos/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', 'promos'] }),
  });
}

export function useDeletePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/company/promos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', 'promos'] }),
  });
}

/* -------------------- Documents -------------------- */

export type CompanyDocument = {
  id: number;
  type: 'trade_registry' | 'tax_certificate' | 'operating_license' | 'insurance';
  file_path: string;
  status: 'pending' | 'approved' | 'rejected';
  expires_at: string | null;
  created_at: string;
};

export function useCompanyDocuments() {
  return useQuery({
    queryKey: ['company', 'documents'],
    queryFn: () => api.get<CompanyDocument[]>('/company/documents'),
  });
}

export async function uploadCompanyDocument(input: {
  type: CompanyDocument['type'];
  file: File;
  expires_at?: string | null;
}): Promise<CompanyDocument> {
  const fd = new FormData();
  fd.append('type', input.type);
  fd.append('file', input.file);
  if (input.expires_at) fd.append('expires_at', input.expires_at);

  const url = `/api/v1/company/documents`;
  const headers = new Headers({ Accept: 'application/json' });
  const access = (await import('@/lib/tokenStore')).tokenStore.get();
  if (access) headers.set('Authorization', `Bearer ${access}`);
  const res = await fetch(url, { method: 'POST', headers, body: fd, credentials: 'include' });
  if (!res.ok) {
    const text = await res.text();
    let msg = res.statusText;
    try { const body = JSON.parse(text); msg = body?.error?.message ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  const json = await res.json();
  return json.data;
}

/* -------------------- Payouts -------------------- */

export type CompanyBankAccount = {
  id: number;
  iban: string;
  account_holder: string;
  bank_name: string | null;
};

export type Payout = {
  id: number;
  period: string;
  amount: number;
  status: string;
  paid_at: string | null;
};

export function useCompanyPayouts() {
  return useQuery({
    queryKey: ['company', 'payouts'],
    queryFn: () => api.get<{ payouts: Payout[]; bank_account: CompanyBankAccount | null }>('/company/payouts'),
  });
}

export function useUpdateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { iban: string; account_holder: string; bank_name?: string }) =>
      api.put<CompanyBankAccount>('/company/bank-account', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', 'payouts'] }),
  });
}

/* -------------------- Settings -------------------- */

export function useCompanySettings() {
  return useQuery({
    queryKey: ['company', 'settings'],
    queryFn: () => api.get<ApiCompany>('/company/settings'),
  });
}

export function useUpdateCompanySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<{
      name: string;
      description: string;
      phone: string;
      address: string;
      city: string;
      languages_spoken: string;
      logo_color: string;
    }>) => api.put<ApiCompany>('/company/settings', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company', 'settings'] });
      qc.invalidateQueries({ queryKey: ['company', 'overview'] });
    },
  });
}

/* -------------------- Messages -------------------- */

export type MessageThread = {
  id: number;
  subject: string | null;
  last_message_at: string;
  unread_count: number;
  customer?: { id: number; name: string; email: string };
  messages?: Array<{ id: number; body: string; sender_id: number; created_at: string; sender?: { id: number; name: string; role: string } }>;
};

export function useCompanyMessages() {
  return useQuery({
    queryKey: ['company', 'messages'],
    queryFn: () => api.get<Paginated<MessageThread>>('/company/messages'),
  });
}

export function useCompanyMessageThread(threadId: number | null) {
  return useQuery({
    queryKey: ['company', 'messages', threadId],
    queryFn: () => api.get<MessageThread>(`/company/messages/${threadId}`),
    enabled: threadId !== null,
  });
}

export function useReplyMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, body }: { threadId: number; body: string }) =>
      api.post(`/company/messages/${threadId}`, { body }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['company', 'messages'] });
      qc.invalidateQueries({ queryKey: ['company', 'messages', vars.threadId] });
    },
  });
}
