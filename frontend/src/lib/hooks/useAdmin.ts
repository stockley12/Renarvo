import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiCar, type ApiCompany, type ApiReservation, type ApiUser, type Paginated } from '../api';

type AdminOverview = {
  companies_total: number;
  companies_pending: number;
  companies_approved: number;
  users_total: number;
  customers_total: number;
  reservations_total: number;
  reservations_this_month: number;
  gmv_this_month: number;
  open_risk_flags: number;
};

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => api.get<AdminOverview>('/admin/overview'),
    staleTime: 60_000,
  });
}

export function useAdminCompanies(query?: { status?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'companies', query],
    queryFn: () => api.get<Paginated<ApiCompany>>('/admin/companies', query),
  });
}

type CompanyAction = 'approve' | 'reject' | 'suspend';

export function useCompanyAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: number; action: CompanyAction; reason?: string }) =>
      api.patch(`/admin/companies/${id}/${action}`, reason ? { reason } : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'companies'] });
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });
}

export function useAdminUsers(query?: { role?: string; status?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'users', query],
    queryFn: () => api.get<Paginated<ApiUser>>('/admin/users', query),
  });
}

export function useUserBan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, banned, reason }: { id: number; banned: boolean; reason?: string }) =>
      api.patch(`/admin/users/${id}/${banned ? 'ban' : 'unban'}`, reason ? { reason } : undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useAdminAuditLog(query?: {
  severity?: string;
  action?: string;
  actor_id?: number;
  target_type?: string;
  from?: string;
  to?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ['admin', 'audit-log', query],
    queryFn: () =>
      api.get<Paginated<{
        id: number;
        action: string;
        actor_id: number | null;
        actor_email: string | null;
        target_type: string | null;
        target_id: number | null;
        metadata: Record<string, unknown>;
        severity: string;
        ip_address: string | null;
        created_at: string;
      }>>('/admin/audit-log', query),
  });
}

export function useAdminRiskFlags(query?: { status?: string; type?: string; page?: number }) {
  return useQuery({
    queryKey: ['admin', 'risk', query],
    queryFn: () =>
      api.get<Paginated<{
        id: number;
        type: string;
        subject_type: string;
        subject_id: number;
        reason: string;
        score: number;
        status: string;
        resolved_at: string | null;
      }>>('/admin/risk', query),
  });
}

export function useAdminBroadcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      audience: string;
      channels: ('email' | 'in_app')[];
      subject: string;
      body: string;
    }) => api.post('/admin/notifications', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'notifications'] }),
  });
}

export function useAdminSystemHealth() {
  return useQuery({
    queryKey: ['admin', 'system', 'health'],
    queryFn: () => api.get<{
      database: { ok: boolean; latency_ms: number | null };
      disk: { free_bytes: number; total_bytes: number; used_pct: number | null };
      fx: { last_refresh: string | null; fresh: boolean };
      jobs: { pending: number; failed_7d: number; last_run_at: string | null };
      php: { version: string; opcache_enabled: boolean; memory_peak_mb: number };
    }>('/admin/system/health'),
    refetchInterval: 30_000,
  });
}

export function useAdminFinanceOverview() {
  return useQuery({
    queryKey: ['admin', 'finance', 'overview'],
    queryFn: () =>
      api.get<{
        gmv_this_month: number;
        commission_this_month: number;
        pending_payouts: number;
        paid_payouts: number;
      }>('/admin/finance'),
  });
}

/* -------------------- Admin catalog -------------------- */
export function useAdminCatalog(query?: { status?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'catalog', query],
    queryFn: () => api.get<Paginated<ApiCar>>('/admin/catalog', query),
  });
}

export function useCatalogAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: number; action: 'hide' | 'flag'; reason?: string }) =>
      api.patch(`/admin/catalog/${id}/${action}`, reason ? { reason } : undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'catalog'] }),
  });
}

/* -------------------- Admin reservations -------------------- */
export function useAdminReservations(query?: { status?: string; payment_status?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'reservations', query],
    queryFn: () => api.get<Paginated<ApiReservation>>('/admin/reservations', query),
  });
}

/* -------------------- Admin payments -------------------- */
export type AdminPayment = {
  id: number;
  provider: string;
  method: string | null;
  status: string;
  amount: number;
  amount_try: number;
  currency: string;
  order_id: string | null;
  trans_id: string | null;
  installment: number;
  hash_inbound_ok: boolean | null;
  error_msg: string | null;
  captured_at: string | null;
  refunded_at: string | null;
  created_at: string;
  reservation: {
    id: number;
    code: string;
    total_price: number;
    payment_status: string;
    status: string;
    car: { id: number; brand: string; model: string } | null;
    customer: { id: number; name: string; email: string } | null;
  } | null;
  company: { id: number; name: string; slug: string } | null;
};

export function useAdminPayments(query?: {
  provider?: string;
  status?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['admin', 'payments', query],
    queryFn: () => api.get<Paginated<AdminPayment>>('/admin/payments', query),
  });
}

/* -------------------- Admin reviews -------------------- */
export type AdminReview = {
  id: number;
  rating: number;
  text: string;
  status: string;
  customer?: { id: number; name: string; email: string };
  company?: { id: number; name: string };
  car?: { id: number; brand: string; model: string };
  created_at: string;
};

export function useAdminReviews(query?: { status?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'reviews', query],
    queryFn: () => api.get<Paginated<AdminReview>>('/admin/reviews', query),
  });
}

export function useReviewAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: number; action: 'hide' | 'restore'; reason?: string }) =>
      api.patch(`/admin/reviews/${id}/${action}`, reason ? { reason } : undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  });
}

/* -------------------- Risk actions -------------------- */
export function useRiskAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: number; action: 'clear' | 'escalate'; note?: string }) =>
      api.patch(`/admin/risk/${id}/${action}`, note ? { note } : undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'risk'] }),
  });
}

/* -------------------- Admin payouts / finance -------------------- */
export type AdminPayout = {
  id: number;
  company_id: number;
  period: string;
  gross: number;
  commission: number;
  net: number;
  status: string;
  paid_at: string | null;
  reference: string | null;
  company?: { id: number; name: string };
};

export function useAdminPayouts(query?: { status?: string; period?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'payouts', query],
    queryFn: () => api.get<Paginated<AdminPayout>>('/admin/finance/payouts', query),
  });
}

export function useProcessPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reference }: { id: number; reference: string }) =>
      api.post(`/admin/finance/payouts/${id}/process`, { reference }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'payouts'] });
      qc.invalidateQueries({ queryKey: ['admin', 'finance', 'overview'] });
    },
  });
}

/* -------------------- Notifications history -------------------- */
export type Broadcast = {
  id: number;
  audience: string;
  channels: string[];
  subject: string;
  body: string;
  total_recipients: number;
  sent_at: string;
};

export function useAdminBroadcastHistory() {
  return useQuery({
    queryKey: ['admin', 'notifications', 'history'],
    queryFn: () => api.get<Broadcast[]>('/admin/notifications'),
  });
}

/* -------------------- Settings -------------------- */
export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api.get<Record<string, unknown>>('/admin/settings'),
  });
}

export function useUpdateAdminSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Record<string, unknown>) => api.put('/admin/settings', { settings }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'settings'] }),
  });
}
