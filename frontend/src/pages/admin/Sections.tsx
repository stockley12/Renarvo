import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  Building2, Car, BadgeDollarSign, Star, Check, X, Flag, FileText,
  CheckCircle2, Loader2, Search, Eye, EyeOff, Ban,
} from 'lucide-react';
import { useApp } from '@/store/app';
import { formatPrice, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import {
  useAdminOverview,
  useAdminCompanies,
  useCompanyAction,
  useAdminCatalog,
  useCatalogAction,
  useAdminReservations,
  useAdminPayments,
  useAdminUsers,
  useUserBan,
  useAdminReviews,
  useReviewAction,
  useAdminFinanceOverview,
  useAdminPayouts,
  useProcessPayout,
  useAdminSettings,
  useUpdateAdminSettings,
} from '@/lib/hooks/useAdmin';

type CompanyStatus = 'pending' | 'approved' | 'suspended' | 'rejected';

const statusBadge: Record<CompanyStatus, string> = {
  pending: 'bg-warning/15 text-warning border-warning/30',
  approved: 'bg-success/15 text-success border-success/30',
  suspended: 'bg-destructive/15 text-destructive border-destructive/30',
  rejected: 'bg-muted text-muted-foreground',
};

/* ============== OVERVIEW ============== */
export function AdminOverview() {
  const { t } = useTranslation();
  const { currency, locale } = useApp();
  const overview = useAdminOverview();
  const o = overview.data;

  if (overview.isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-6 w-6 mr-2 animate-spin" /> {t('panel.admin.overview.loading')}
      </div>
    );
  }

  if (!o) {
    return <div className="text-muted-foreground">{t('panel.admin.overview.unavailable')}</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{t('panel.admin.overview.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('panel.admin.overview.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('panel.admin.overview.gmvThisMonth')} value={formatPrice(o.gmv_this_month, currency, locale)} icon={BadgeDollarSign} accent="success" />
        <StatCard label={t('panel.admin.overview.activeCompanies')} value={o.companies_approved} icon={Building2} accent="navy" />
        <StatCard label={t('panel.admin.overview.pendingCompanies')} value={o.companies_pending} icon={Building2} accent="warning" />
        <StatCard label={t('panel.admin.overview.totalUsers')} value={o.users_total} icon={Car} accent="brand" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('panel.admin.overview.customers')} value={o.customers_total} icon={Building2} accent="brand" />
        <StatCard label={t('panel.admin.overview.reservationsTotal')} value={o.reservations_total} icon={Car} accent="navy" />
        <StatCard label={t('panel.admin.overview.reservationsThisMonth')} value={o.reservations_this_month} icon={Car} accent="success" />
        <StatCard label={t('panel.admin.overview.openApprovals')} value={o.companies_pending} icon={Building2} accent="warning" />
      </div>
    </div>
  );
}

/* ============== COMPANIES ============== */
export function AdminCompanies() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<CompanyStatus>('approved');
  const companies = useAdminCompanies({ status: tab, limit: 100 });
  const action = useCompanyAction();

  async function go(id: number, type: 'approve' | 'suspend' | 'reject') {
    let reason: string | undefined;
    if (type === 'reject' || type === 'suspend') {
      reason = window.prompt(type === 'reject' ? t('panel.admin.companies.rejectionReason') : t('panel.admin.companies.suspensionReason')) ?? '';
      if (!reason.trim()) return;
    }
    try {
      await action.mutateAsync({ id, action: type, reason });
      toast.success(t(`panel.admin.companies.toast.${type}`));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.actionFailed'));
    }
  }

  const items = companies.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{t('panel.admin.nav.companies')}</h1>
      <Tabs value={tab} onValueChange={(v) => setTab(v as CompanyStatus)}>
        <TabsList className="flex-wrap h-auto">
          {(['approved', 'pending', 'suspended', 'rejected'] as CompanyStatus[]).map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {t(`panel.admin.companies.status.${s}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{t('panel.admin.companies.company')}</th>
                  <th className="px-4 py-3">{t('common.city')}</th>
                  <th className="px-4 py-3">{t('panel.admin.companies.owner')}</th>
                  <th className="px-4 py-3">{t('panel.common.status')}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {companies.isLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                    </td>
                  </tr>
                )}
                {!companies.isLoading && items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      {t('panel.admin.companies.noneForStatus', { status: t(`panel.admin.companies.status.${tab}`) })}
                    </td>
                  </tr>
                )}
                {items.map((co) => {
                  const owner = (co as unknown as { owner?: { name: string; email: string } }).owner;
                  const initials = co.name.split(' ').map((w) => w[0]).slice(0, 2).join('');
                  const color = co.logo_color ?? '210 80% 50%';
                  return (
                    <tr key={co.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                            style={{ background: `hsl(${color})` }}
                          >
                            {initials}
                          </div>
                          <div className="font-semibold">{co.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{co.city}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{owner?.email ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={statusBadge[co.status as CompanyStatus]}>
                          {t(`panel.admin.companies.status.${co.status}`)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          {co.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-success text-success-foreground"
                                onClick={() => go(co.id, 'approve')}
                                disabled={action.isPending}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => go(co.id, 'reject')} disabled={action.isPending}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {co.status === 'approved' && (
                            <Button size="sm" variant="outline" onClick={() => go(co.id, 'suspend')} disabled={action.isPending}>
                              {t('panel.admin.companies.suspend')}
                            </Button>
                          )}
                          {co.status === 'suspended' && (
                            <Button size="sm" variant="outline" onClick={() => go(co.id, 'approve')} disabled={action.isPending}>
                              {t('panel.admin.companies.reinstate')}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============== APPROVALS ============== */
export function AdminApprovals() {
  const { t } = useTranslation();
  const companies = useAdminCompanies({ status: 'pending', limit: 100 });
  const action = useCompanyAction();

  async function approve(id: number) {
    try {
      await action.mutateAsync({ id, action: 'approve' });
      toast.success(t('panel.admin.approvals.approvedToast'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.actionFailed'));
    }
  }

  async function reject(id: number) {
    const reason = window.prompt(t('panel.admin.approvals.rejectionReasonPrompt')) ?? '';
    if (!reason.trim()) return;
    try {
      await action.mutateAsync({ id, action: 'reject', reason });
      toast.success(t('panel.admin.approvals.rejectedToast'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.actionFailed'));
    }
  }

  const items = companies.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{t('panel.admin.approvals.title')}</h1>
      <p className="text-muted-foreground">{t('panel.admin.approvals.pendingCount', { count: companies.data?.meta.total ?? 0 })}</p>

      {companies.isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      <div className="space-y-4">
        {!companies.isLoading && items.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-success" />
            {t('panel.admin.approvals.allCaughtUp')}
          </Card>
        )}
        {items.map((co) => {
          const owner = (co as unknown as { owner?: { name: string; email: string } }).owner;
          const initials = co.name.split(' ').map((w) => w[0]).slice(0, 2).join('');
          const color = co.logo_color ?? '210 80% 50%';
          return (
            <Card key={co.id} className="p-5">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: `hsl(${color})` }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <h3 className="font-display font-bold">{co.name}</h3>
                  <p className="text-sm text-muted-foreground">{co.city}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('panel.admin.approvals.ownerLine', { name: owner?.name ?? '—', email: owner?.email ?? '—' })}</p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Badge variant="outline" className="gap-1">
                      <FileText className="h-3 w-3" /> {t('panel.admin.approvals.documentsPending')}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" className="bg-success text-success-foreground" disabled={action.isPending} onClick={() => approve(co.id)}>
                      <Check className="h-4 w-4 mr-1" /> {t('panel.admin.approvals.approve')}
                  </Button>
                    <Button size="sm" variant="destructive" disabled={action.isPending} onClick={() => reject(co.id)}>
                      <X className="h-4 w-4 mr-1" /> {t('panel.admin.approvals.reject')}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ============== CATALOG ============== */
export function AdminCatalog() {
  const { t } = useTranslation();
  const { currency, locale } = useApp();
  const [q, setQ] = useState('');
  const cars = useAdminCatalog({ search: q || undefined, limit: 100 });
  const action = useCatalogAction();

  async function hide(id: number) {
    const reason = window.prompt(t('panel.admin.catalog.reasonHideOptional')) ?? undefined;
    try {
      await action.mutateAsync({ id, action: 'hide', reason });
      toast.success(t('panel.admin.catalog.hiddenToast'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.actionFailed'));
    }
  }

  async function flag(id: number) {
    const reason = window.prompt(t('panel.admin.catalog.reasonFlag')) ?? '';
    if (!reason.trim()) return;
    try {
      await action.mutateAsync({ id, action: 'flag', reason });
      toast.success(t('panel.admin.catalog.flaggedToast'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.actionFailed'));
    }
  }

  const items = cars.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{t('panel.admin.catalog.title')}</h1>
        <div className="relative w-full max-w-xs">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('panel.admin.catalog.searchPlaceholder')} className="pl-9" />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t('panel.common.car')}</th>
              <th className="px-4 py-3">{t('panel.admin.companies.company')}</th>
              <th className="px-4 py-3">{t('common.city')}</th>
              <th className="px-4 py-3">{t('panel.common.status')}</th>
              <th className="px-4 py-3 text-right">{t('panel.admin.catalog.pricePerDay')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {cars.isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                </td>
              </tr>
            )}
            {!cars.isLoading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  {t('panel.admin.catalog.noCars')}
                </td>
              </tr>
            )}
            {items.map((c) => (
              <tr key={c.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold">
                  {c.brand} {c.model} <span className="text-xs text-muted-foreground font-normal">({c.year})</span>
                </td>
                <td className="px-4 py-3">{c.company?.name ?? '—'}</td>
                <td className="px-4 py-3">{c.city}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="capitalize">
                    {t(`panel.admin.catalog.status.${c.status}`)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatPrice(c.price_per_day, currency, locale)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => flag(c.id)} title={t('panel.admin.catalog.flag')}>
                      <Flag className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => hide(c.id)}
                      className="text-destructive"
                      title={t('panel.admin.catalog.hide')}
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  );
}

/* ============== RESERVATIONS ============== */
const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid: 'bg-success/15 text-success border-success/30',
  pending: 'bg-warning/15 text-warning border-warning/30',
  unpaid: 'bg-muted text-muted-foreground',
  failed: 'bg-destructive/15 text-destructive border-destructive/30',
  cancelled: 'bg-muted text-muted-foreground',
  refunded: 'bg-primary/15 text-primary border-primary/30',
  authorized: 'bg-primary/10 text-primary border-primary/30',
};

export function AdminReservations() {
  const { t } = useTranslation();
  const { currency, locale } = useApp();
  const [q, setQ] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [openId, setOpenId] = useState<number | null>(null);
  const reservations = useAdminReservations({
    search: q || undefined,
    payment_status: paymentStatus || undefined,
    limit: 100,
  });
  const items = reservations.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{t('panel.admin.reservations.title')}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="h-9 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="">{t('panel.admin.reservations.anyPayment')}</option>
            <option value="paid">{t('panel.admin.reservations.paymentStatus.paid')}</option>
            <option value="pending">{t('panel.admin.reservations.paymentStatus.pending')}</option>
            <option value="unpaid">{t('panel.admin.reservations.paymentStatus.unpaid')}</option>
            <option value="failed">{t('panel.admin.reservations.paymentStatus.failed')}</option>
            <option value="refunded">{t('panel.admin.reservations.paymentStatus.refunded')}</option>
          </select>
          <div className="relative w-full max-w-xs">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('panel.admin.reservations.searchPlaceholder')} className="pl-9" />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t('panel.common.code')}</th>
                <th className="px-4 py-3">{t('panel.common.customer')}</th>
                <th className="px-4 py-3">{t('panel.admin.companies.company')}</th>
                <th className="px-4 py-3">{t('panel.common.pickup')}</th>
                <th className="px-4 py-3">{t('panel.common.status')}</th>
                <th className="px-4 py-3">{t('panel.admin.reservations.payment')}</th>
                <th className="px-4 py-3">TIKO refs</th>
                <th className="px-4 py-3 text-right">{t('common.total')}</th>
                <th className="px-4 py-3 text-right">{t('panel.admin.reservations.paidTry')}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {reservations.isLoading && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                  </td>
                </tr>
              )}
              {!reservations.isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                    {t('panel.admin.reservations.noReservations')}
                  </td>
                </tr>
              )}
              {items.map((r) => {
                const cp = r.current_payment;
                const ps = r.payment_status ?? 'unpaid';
                return (
                  <tr key={r.id} className="border-t hover:bg-muted/30 align-top">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{r.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.customer?.name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{r.customer?.email ?? ''}</div>
                    </td>
                    <td className="px-4 py-3">{r.company?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(r.pickup_at, locale)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">
                        {t(`panel.admin.reservations.status.${r.status}`)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`capitalize ${PAYMENT_STATUS_COLORS[ps] ?? ''}`}>
                        {t(`panel.admin.reservations.paymentStatus.${ps}`)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {cp ? (
                        <div className="space-y-0.5">
                          {cp.order_id && <div className="font-mono">o:{cp.order_id}</div>}
                          {cp.trans_id && <div className="font-mono">t:{cp.trans_id}</div>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{formatPrice(r.price.total, currency, locale)}</td>
                    <td className="px-4 py-3 text-right text-xs">
                      {cp?.amount_try ? `₺${cp.amount_try.toLocaleString()}` : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Sheet open={openId === r.id} onOpenChange={(o) => setOpenId(o ? r.id : null)}>
                        <SheetTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3.5 w-3.5 me-1" />{t('common.view')}
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="overflow-auto sm:max-w-lg">
                          <SheetHeader>
                            <SheetTitle>{t('panel.admin.reservations.detail')} #{r.code}</SheetTitle>
                          </SheetHeader>
                          <div className="space-y-5 mt-6 text-sm">
                            <div>
                              <h4 className="font-semibold mb-2">{t('panel.common.customer')}</h4>
                              <p>
                                {r.customer?.name ?? '—'}
                                {r.customer?.email && <><br />{r.customer.email}</>}
                                {r.customer?.phone && <><br />{r.customer.phone}</>}
                              </p>
                            </div>
                            <Separator />
                            <div>
                              <h4 className="font-semibold mb-2">{t('panel.company.reservations.booking')}</h4>
                              <p>
                                {r.car ? `${r.car.brand} ${r.car.model}` : `Car #${r.car_id}`}
                                <br />
                                {formatDate(r.pickup_at, locale)} → {formatDate(r.return_at, locale)}
                                <br />
                                {r.pickup_location}
                              </p>
                              {r.flight_number && <p className="text-xs text-muted-foreground mt-1">{t('panel.company.reservations.flight')}: {r.flight_number}</p>}
                              {r.notes && <p className="text-xs text-muted-foreground mt-1">{t('panel.company.reservations.note')}: {r.notes}</p>}
                            </div>
                            {(r.driving_license_number || r.id_number || r.date_of_birth || (r.documents && r.documents.length > 0)) && (
                              <>
                                <Separator />
                                <div>
                                  <h4 className="font-semibold mb-2">{t('panel.company.reservations.driverDocuments')}</h4>
                                  <div className="space-y-1.5 text-xs">
                                    {r.driving_license_number && (
                                      <p><span className="text-muted-foreground">{t('booking.drivingLicense')}:</span> <span className="font-mono">{r.driving_license_number}</span></p>
                                    )}
                                    {r.id_number && (
                                      <p><span className="text-muted-foreground">{t('booking.idNumber')}:</span> <span className="font-mono">{r.id_number}</span></p>
                                    )}
                                    {r.date_of_birth && (
                                      <p><span className="text-muted-foreground">{t('booking.dateOfBirth')}:</span> {r.date_of_birth}</p>
                                    )}
                                  </div>
                                  {r.documents && r.documents.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                      {r.documents.map((doc, i) => (
                                        <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg border overflow-hidden hover:border-primary transition-colors">
                                          <img src={doc.url} alt={doc.type} className="w-full h-24 object-cover" />
                                          <div className="p-1.5 text-[11px] text-center text-muted-foreground capitalize">{doc.type.replace('_', ' ')}</div>
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                            <Separator />
                            <div>
                              <h4 className="font-semibold mb-2">{t('panel.company.reservations.pricing')}</h4>
                              <div className="space-y-1">
                                <div className="flex justify-between"><span>{t('panel.company.reservations.baseDays', { days: r.days })}</span><span>{formatPrice(r.price.base, currency, locale)}</span></div>
                                {r.price.extras > 0 && <div className="flex justify-between text-muted-foreground"><span>{t('booking.extras')}</span><span>{formatPrice(r.price.extras, currency, locale)}</span></div>}
                                {r.price.discount > 0 && <div className="flex justify-between text-success"><span>{t('panel.company.reservations.discount')}</span><span>−{formatPrice(r.price.discount, currency, locale)}</span></div>}
                                {r.price.service_fee > 0 && <div className="flex justify-between text-muted-foreground"><span>{t('carDetail.serviceFee')}</span><span>{formatPrice(r.price.service_fee, currency, locale)}</span></div>}
                                {r.price.tax > 0 && <div className="flex justify-between text-muted-foreground"><span>{t('carDetail.taxKdv')}</span><span>{formatPrice(r.price.tax, currency, locale)}</span></div>}
                                <div className="flex justify-between font-bold pt-2 border-t mt-2">
                                  <span>{t('common.total')}</span>
                                  <span>{formatPrice(r.price.total, currency, locale)}</span>
                                </div>
                              </div>
                            </div>
                            {r.current_payment && (
                              <>
                                <Separator />
                                <div>
                                  <h4 className="font-semibold mb-2">{t('panel.admin.reservations.payment')}</h4>
                                  <div className="space-y-1 text-xs">
                                    <p><span className="text-muted-foreground">Provider:</span> {r.current_payment.provider}</p>
                                    <p><span className="text-muted-foreground">Status:</span> <Badge variant="outline" className="capitalize">{r.current_payment.status}</Badge></p>
                                    {r.current_payment.order_id && <p><span className="text-muted-foreground">Order ID:</span> <span className="font-mono">{r.current_payment.order_id}</span></p>}
                                    {r.current_payment.trans_id && <p><span className="text-muted-foreground">Trans ID:</span> <span className="font-mono">{r.current_payment.trans_id}</span></p>}
                                    <p><span className="text-muted-foreground">Amount:</span> ₺{r.current_payment.amount_try.toLocaleString()}</p>
                                  </div>
                                </div>
                              </>
                            )}
                            {r.cancellation_reason && (
                              <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-xs">
                                <strong>{t('panel.company.reservations.cancellationReason')}:</strong> {r.cancellation_reason}
                              </div>
                            )}
                          </div>
                        </SheetContent>
                      </Sheet>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============== PAYMENTS ============== */
export function AdminPayments() {
  const { t } = useTranslation();
  const { currency, locale } = useApp();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [provider, setProvider] = useState('');
  const payments = useAdminPayments({
    search: q || undefined,
    status: status || undefined,
    provider: provider || undefined,
    limit: 100,
  });
  const items = payments.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{t('panel.admin.nav.payments')}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={provider} onChange={(e) => setProvider(e.target.value)} className="h-9 rounded-lg border bg-background px-3 text-sm">
            <option value="">{t('panel.admin.payments.anyProvider')}</option>
            <option value="tiko">TIKO</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-lg border bg-background px-3 text-sm">
            <option value="">{t('panel.admin.payments.anyStatus')}</option>
            <option value="pending">{t('panel.admin.payments.status.pending')}</option>
            <option value="authorized">{t('panel.admin.payments.status.authorized')}</option>
            <option value="captured">{t('panel.admin.payments.status.captured')}</option>
            <option value="failed">{t('panel.admin.payments.status.failed')}</option>
            <option value="cancelled">{t('panel.admin.payments.status.cancelled')}</option>
            <option value="refunded">{t('panel.admin.payments.status.refunded')}</option>
          </select>
          <div className="relative w-full max-w-xs">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('panel.admin.payments.searchPlaceholder')} className="pl-9" />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t('panel.admin.payments.reservation')}</th>
                <th className="px-4 py-3">{t('panel.common.customer')}</th>
                <th className="px-4 py-3">{t('panel.admin.companies.company')}</th>
                <th className="px-4 py-3">{t('panel.admin.payments.provider')}</th>
                <th className="px-4 py-3">{t('panel.common.status')}</th>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Trans ID</th>
                <th className="px-4 py-3 text-right">{t('panel.admin.payments.amountTry')}</th>
                <th className="px-4 py-3">{t('panel.admin.payments.captured')}</th>
              </tr>
            </thead>
            <tbody>
              {payments.isLoading && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                  </td>
                </tr>
              )}
              {!payments.isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    {t('panel.admin.payments.none')}
                  </td>
                </tr>
              )}
              {items.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/30 align-top">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{p.reservation?.code ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.reservation?.customer?.name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">{p.reservation?.customer?.email ?? ''}</div>
                  </td>
                  <td className="px-4 py-3">{p.company?.name ?? '—'}</td>
                  <td className="px-4 py-3 capitalize">{p.provider}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`capitalize ${PAYMENT_STATUS_COLORS[p.status] ?? ''}`}>
                      {t(`panel.admin.payments.status.${p.status}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.order_id ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.trans_id ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {p.amount_try ? `₺${p.amount_try.toLocaleString()}` : formatPrice(p.amount, currency, locale)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.captured_at ? formatDate(p.captured_at, locale) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============== USERS ============== */
export function AdminUsers() {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<'all' | 'company_users' | 'normal_users'>('all');
  const [role, setRole] = useState<string>('');
  const users = useAdminUsers({ search: q || undefined, role: role || undefined, kind, limit: 100 });
  const ban = useUserBan();

  async function toggle(id: number, banned: boolean) {
    const reason = banned ? window.prompt(t('panel.admin.users.reasonForBan')) ?? '' : undefined;
    if (banned && !reason?.trim()) return;
    try {
      await ban.mutateAsync({ id, banned, reason });
      toast.success(banned ? t('panel.admin.users.bannedToast') : t('panel.admin.users.unbannedToast'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.actionFailed'));
    }
  }

  const items = users.data?.data ?? [];
  const roleLabel = (roleValue: string) => {
    if (roleValue === 'customer') return t('panel.admin.users.roleCustomer');
    if (roleValue === 'company_owner') return t('panel.admin.users.roleCompanyOwner');
    if (roleValue === 'company_staff') return t('panel.admin.users.roleCompanyStaff');
    if (roleValue === 'superadmin') return t('panel.admin.users.roleSuperadmin');
    return t('panel.admin.users.roleUnknown', { role: roleValue.replace('_', ' ') });
  };
  const statusLabel = (statusValue: string) => {
    if (statusValue === 'active') return t('panel.admin.users.statusActive');
    if (statusValue === 'banned') return t('panel.admin.users.statusBanned');
    return t('panel.admin.users.statusUnknown', { status: statusValue });
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{t('panel.admin.users.title')}</h1>
        <div className="flex gap-3 items-center flex-wrap w-full sm:w-auto">
          <select
            value={kind}
            onChange={(e) => {
              const next = e.target.value as 'all' | 'company_users' | 'normal_users';
              setKind(next);
              setRole('');
            }}
            className="h-10 rounded-lg border bg-background px-3 text-sm flex-1 sm:flex-none min-w-[140px]"
          >
            <option value="all">{t('panel.admin.users.kindAll')}</option>
            <option value="normal_users">{t('panel.admin.users.kindNormal')}</option>
            <option value="company_users">{t('panel.admin.users.kindCompany')}</option>
          </select>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm flex-1 sm:flex-none min-w-[140px]"
          >
            <option value="">{t('panel.admin.users.rolesAll')}</option>
            <option value="customer">{t('panel.admin.users.roleCustomer')}</option>
            <option value="company_owner">{t('panel.admin.users.roleCompanyOwner')}</option>
            <option value="company_staff">{t('panel.admin.users.roleCompanyStaff')}</option>
            <option value="superadmin">{t('panel.admin.users.roleSuperadmin')}</option>
          </select>
          <div className="relative w-full max-w-xs">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('panel.admin.users.searchPlaceholder')} className="pl-9" />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t('panel.admin.users.user')}</th>
              <th className="px-4 py-3">{t('panel.admin.users.role')}</th>
              <th className="px-4 py-3">{t('panel.admin.users.status')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                </td>
              </tr>
            )}
            {!users.isLoading && items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  {t('panel.admin.users.noUsers')}
                </td>
              </tr>
            )}
            {items.map((u) => (
              <tr key={u.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-gradient-brand text-white text-xs">
                        {u.name?.split(' ').map((w) => w[0]).slice(0, 2).join('') ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="capitalize">
                    {roleLabel(u.role)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.status === 'active' ? 'secondary' : 'destructive'}>{statusLabel(u.status)}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant={u.status === 'active' ? 'outline' : 'ghost'}
                    onClick={() => toggle(u.id, u.status === 'active')}
                    disabled={ban.isPending}
                  >
                    <Ban className="h-3.5 w-3.5 mr-1" />
                    {u.status === 'active' ? t('panel.admin.users.ban') : t('panel.admin.users.unban')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  );
}

/* ============== REVIEWS ============== */
export function AdminReviews() {
  const { t } = useTranslation();
  const reviews = useAdminReviews({ limit: 100 });
  const action = useReviewAction();

  async function toggle(id: number, hide: boolean) {
    try {
      await action.mutateAsync({ id, action: hide ? 'hide' : 'restore' });
      toast.success(hide ? t('panel.admin.reviews.hiddenToast') : t('panel.admin.reviews.restoredToast'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.actionFailed'));
    }
  }

  const items = reviews.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{t('panel.admin.reviews.title')}</h1>
      {reviews.isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {!reviews.isLoading && items.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">{t('panel.admin.reviews.none')}</Card>
      )}
      {items.map((r) => (
        <Card key={r.id} className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{r.customer?.name ?? t('panel.admin.reviews.anonymous')}</span>
                {r.car && <Badge variant="outline">{r.car.brand} {r.car.model}</Badge>}
                {r.company && <Badge variant="outline">{r.company.name}</Badge>}
                <Badge variant={r.status === 'visible' ? 'secondary' : 'outline'} className="capitalize">
                  {t(`panel.admin.reviews.status.${r.status}`)}
                </Badge>
              </div>
              <div className="flex gap-0.5 my-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className={`h-4 w-4 ${j < r.rating ? 'fill-warning text-warning' : 'text-muted'}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{r.text}</p>
            </div>
            <div className="flex gap-2">
              {r.status === 'visible' ? (
                <Button size="sm" variant="outline" onClick={() => toggle(r.id, true)} disabled={action.isPending}>
                  <EyeOff className="h-3.5 w-3.5 mr-1" /> {t('panel.admin.reviews.hide')}
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => toggle(r.id, false)} disabled={action.isPending}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> {t('panel.admin.reviews.restore')}
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ============== CONTENT (placeholder, future) ============== */
export function AdminContent() {
  const { t } = useTranslation();
  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{t('panel.admin.nav.content')}</h1>
      <Card className="p-10 text-center text-muted-foreground">
        {t('panel.admin.content.placeholder')}
      </Card>
    </div>
  );
}

/* ============== FINANCE ============== */
export function AdminFinance() {
  const { t } = useTranslation();
  const { currency, locale } = useApp();
  const overview = useAdminFinanceOverview();
  const payouts = useAdminPayouts({ limit: 50 });
  const process = useProcessPayout();

  async function pay(id: number) {
    const reference = window.prompt(t('panel.admin.finance.bankTransferReference')) ?? '';
    if (!reference.trim()) return;
    try {
      await process.mutateAsync({ id, reference });
      toast.success(t('panel.admin.finance.payoutMarkedPaid'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.actionFailed'));
    }
  }

  const o = overview.data;
  const items = payouts.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{t('panel.admin.nav.finance')}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('panel.admin.finance.gmvThisMonth')}
          value={o ? formatPrice(o.gmv_this_month, currency, locale) : '—'}
          icon={BadgeDollarSign}
          accent="success"
        />
        <StatCard
          label={t('panel.admin.finance.commissionThisMonth')}
          value={o ? formatPrice(o.commission_this_month, currency, locale) : '—'}
          icon={BadgeDollarSign}
          accent="brand"
        />
        <StatCard label={t('panel.admin.finance.pendingPayouts')} value={o?.pending_payouts ?? '—'} icon={BadgeDollarSign} accent="warning" />
        <StatCard label={t('panel.admin.finance.paidPayouts')} value={o?.paid_payouts ?? '—'} icon={CheckCircle2} accent="navy" />
      </div>

      <Card className="overflow-hidden">
        <div className="p-5 border-b font-display font-bold">{t('panel.admin.finance.companyPayouts')}</div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t('panel.admin.companies.company')}</th>
              <th className="px-4 py-3">{t('panel.admin.finance.period')}</th>
              <th className="px-4 py-3 text-right">{t('panel.admin.finance.gross')}</th>
              <th className="px-4 py-3 text-right">{t('panel.admin.finance.commission')}</th>
              <th className="px-4 py-3 text-right">{t('panel.admin.finance.net')}</th>
              <th className="px-4 py-3">{t('panel.common.status')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {payouts.isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                </td>
              </tr>
            )}
            {!payouts.isLoading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  {t('panel.admin.finance.noPayouts')}
                </td>
              </tr>
            )}
            {items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3 font-semibold">{p.company?.name ?? `${t('panel.admin.companies.company')} #${p.company_id}`}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{p.period}</td>
                <td className="px-4 py-3 text-right">{formatPrice(p.gross, currency, locale)}</td>
                <td className="px-4 py-3 text-right text-warning">−{formatPrice(p.commission, currency, locale)}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatPrice(p.net, currency, locale)}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="capitalize">
                    {t(`panel.admin.finance.status.${p.status}`)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {p.status === 'pending' && (
                    <Button size="sm" variant="outline" onClick={() => pay(p.id)} disabled={process.isPending}>
                      {t('panel.admin.finance.markPaid')}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  );
}

/* ============== SETTINGS ============== */
export function AdminSettings() {
  const { t } = useTranslation();
  const settings = useAdminSettings();
  const update = useUpdateAdminSettings();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [primed, setPrimed] = useState(false);

  if (!primed && settings.data) {
    const flat: Record<string, string> = {};
    Object.entries(settings.data).forEach(([k, v]) => {
      flat[k] = typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v) : JSON.stringify(v);
    });
    setDraft(flat);
    setPrimed(true);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const parsed: Record<string, unknown> = {};
      Object.entries(draft).forEach(([k, v]) => {
        const numeric = Number(v);
        parsed[k] = !isNaN(numeric) && v.trim() !== '' && /^[\d.,-]+$/.test(v) ? numeric : v;
      });
      await update.mutateAsync(parsed);
      toast.success(t('panel.admin.settings.saved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.admin.settings.saveFailed'));
    }
  }

  if (settings.isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-6 w-6 mr-2 animate-spin" /> {t('panel.admin.settings.loading')}
      </div>
    );
  }

  const keys = Object.keys(draft).sort();

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{t('panel.admin.settings.title')}</h1>
      <form onSubmit={onSave}>
        <Card className="p-6 space-y-4">
          {keys.length === 0 && <p className="text-sm text-muted-foreground">{t('panel.admin.settings.none')}</p>}
          {keys.map((k) => (
            <div key={k}>
              <Label className="font-mono text-xs">{k}</Label>
              {draft[k].length > 60 ? (
                <Textarea
                  rows={3}
                  value={draft[k]}
                  onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                />
              ) : (
                <Input value={draft[k]} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))} />
              )}
            </div>
          ))}
        </Card>
        <Separator className="my-5" />
        <Button type="submit" disabled={update.isPending} className="bg-gradient-brand text-white border-0">
          {update.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {t('common.saveChanges')}
        </Button>
      </form>
    </div>
  );
}
