import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiCompany, type ApiUser, type Paginated } from '../api';

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

export function useAdminCompanies(query?: { status?: string; search?: string; page?: number }) {
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

export function useAdminUsers(query?: { role?: string; status?: string; search?: string; page?: number }) {
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
