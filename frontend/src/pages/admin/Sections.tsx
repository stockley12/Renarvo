import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  Building2, Car, BadgeDollarSign, Star, Shield, Check, X, Flag, FileText,
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
  const { currency, locale } = useApp();
  const overview = useAdminOverview();
  const o = overview.data;

  if (overview.isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-6 w-6 mr-2 animate-spin" /> Loading platform metrics...
      </div>
    );
  }

  if (!o) {
    return <div className="text-muted-foreground">Overview unavailable.</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Platform overview</h1>
        <p className="text-muted-foreground mt-1">Renarvo at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="GMV (this month)" value={formatPrice(o.gmv_this_month, currency, locale)} icon={BadgeDollarSign} accent="success" />
        <StatCard label="Active companies" value={o.companies_approved} icon={Building2} accent="navy" />
        <StatCard label="Pending companies" value={o.companies_pending} icon={Building2} accent="warning" />
        <StatCard label="Total users" value={o.users_total} icon={Car} accent="brand" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Customers" value={o.customers_total} icon={Building2} accent="brand" />
        <StatCard label="Reservations total" value={o.reservations_total} icon={Car} accent="navy" />
        <StatCard label="Reservations this month" value={o.reservations_this_month} icon={Car} accent="success" />
        <StatCard label="Open risk flags" value={o.open_risk_flags} icon={Shield} accent="warning" />
      </div>
    </div>
  );
}

/* ============== COMPANIES ============== */
export function AdminCompanies() {
  const [tab, setTab] = useState<CompanyStatus>('approved');
  const companies = useAdminCompanies({ status: tab, limit: 100 });
  const action = useCompanyAction();

  async function go(id: number, type: 'approve' | 'suspend' | 'reject') {
    let reason: string | undefined;
    if (type === 'reject' || type === 'suspend') {
      reason = window.prompt(`${type === 'reject' ? 'Rejection' : 'Suspension'} reason?`) ?? '';
      if (!reason.trim()) return;
    }
    try {
      await action.mutateAsync({ id, action: type, reason });
      toast.success(`Company ${type}${type === 'approve' ? 'd' : 'ed'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  }

  const items = companies.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      <h1 className="font-display text-3xl font-extrabold">Companies</h1>
      <Tabs value={tab} onValueChange={(v) => setTab(v as CompanyStatus)}>
        <TabsList className="flex-wrap h-auto">
          {(['approved', 'pending', 'suspended', 'rejected'] as CompanyStatus[]).map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Status</th>
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
                      No {tab} companies
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
                          {co.status}
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
                              Suspend
                            </Button>
                          )}
                          {co.status === 'suspended' && (
                            <Button size="sm" variant="outline" onClick={() => go(co.id, 'approve')} disabled={action.isPending}>
                              Reinstate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============== APPROVALS ============== */
export function AdminApprovals() {
  const companies = useAdminCompanies({ status: 'pending', limit: 100 });
  const action = useCompanyAction();

  async function approve(id: number) {
    try {
      await action.mutateAsync({ id, action: 'approve' });
      toast.success('Company approved — they can now list cars');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  }

  async function reject(id: number) {
    const reason = window.prompt('Rejection reason?') ?? '';
    if (!reason.trim()) return;
    try {
      await action.mutateAsync({ id, action: 'reject', reason });
      toast.success('Company rejected');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  }

  const items = companies.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="font-display text-3xl font-extrabold">Approvals queue</h1>
      <p className="text-muted-foreground">{companies.data?.meta.total ?? 0} companies pending review</p>

      {companies.isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      <div className="space-y-4">
        {!companies.isLoading && items.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-success" />
            All caught up — no pending approvals
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
                  <p className="text-xs text-muted-foreground mt-1">Owner: {owner?.name ?? '—'} ({owner?.email ?? '—'})</p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Badge variant="outline" className="gap-1">
                      <FileText className="h-3 w-3" /> Documents pending review
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-success text-success-foreground" disabled={action.isPending} onClick={() => approve(co.id)}>
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" disabled={action.isPending} onClick={() => reject(co.id)}>
                    <X className="h-4 w-4 mr-1" /> Reject
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
  const { currency, locale } = useApp();
  const [q, setQ] = useState('');
  const cars = useAdminCatalog({ search: q || undefined, limit: 100 });
  const action = useCatalogAction();

  async function hide(id: number) {
    const reason = window.prompt('Reason for hiding (optional)?') ?? undefined;
    try {
      await action.mutateAsync({ id, action: 'hide', reason });
      toast.success('Car hidden from public catalog');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  }

  async function flag(id: number) {
    const reason = window.prompt('Reason for flagging?') ?? '';
    if (!reason.trim()) return;
    try {
      await action.mutateAsync({ id, action: 'flag', reason });
      toast.success('Car flagged');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  }

  const items = cars.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl font-extrabold">Catalog moderation</h1>
        <div className="relative w-full max-w-xs">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cars..." className="pl-9" />
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Car</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Price/day</th>
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
                  No cars in catalog
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
                    {c.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatPrice(c.price_per_day, currency, locale)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => flag(c.id)} title="Flag">
                      <Flag className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => hide(c.id)}
                      className="text-destructive"
                      title="Hide"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ============== RESERVATIONS ============== */
export function AdminReservations() {
  const { currency, locale } = useApp();
  const [q, setQ] = useState('');
  const reservations = useAdminReservations({ search: q || undefined, limit: 100 });
  const items = reservations.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl font-extrabold">All reservations</h1>
        <div className="relative w-full max-w-xs">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by code or email..." className="pl-9" />
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Pickup</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {reservations.isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                </td>
              </tr>
            )}
            {!reservations.isLoading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No reservations
                </td>
              </tr>
            )}
            {items.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{r.code}</td>
                <td className="px-4 py-3">{r.customer?.name ?? '—'}</td>
                <td className="px-4 py-3">{r.company?.name ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(r.pickup_at, locale)}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="capitalize">
                    {r.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-semibold">{formatPrice(r.price.total, currency, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ============== USERS ============== */
export function AdminUsers() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState<string>('');
  const users = useAdminUsers({ search: q || undefined, role: role || undefined, limit: 100 });
  const ban = useUserBan();

  async function toggle(id: number, banned: boolean) {
    const reason = banned ? window.prompt('Reason for ban?') ?? '' : undefined;
    if (banned && !reason?.trim()) return;
    try {
      await ban.mutateAsync({ id, banned, reason });
      toast.success(banned ? 'User banned' : 'User unbanned');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  }

  const items = users.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl font-extrabold">Users</h1>
        <div className="flex gap-3 items-center">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="">All roles</option>
            <option value="customer">Customers</option>
            <option value="company_owner">Company owners</option>
            <option value="company_staff">Company staff</option>
            <option value="superadmin">Superadmins</option>
          </select>
          <div className="relative w-full max-w-xs">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by email or name..." className="pl-9" />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
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
                  No users found
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
                    {u.role.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.status === 'active' ? 'secondary' : 'destructive'}>{u.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant={u.status === 'active' ? 'outline' : 'ghost'}
                    onClick={() => toggle(u.id, u.status === 'active')}
                    disabled={ban.isPending}
                  >
                    <Ban className="h-3.5 w-3.5 mr-1" />
                    {u.status === 'active' ? 'Ban' : 'Unban'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ============== REVIEWS ============== */
export function AdminReviews() {
  const reviews = useAdminReviews({ limit: 100 });
  const action = useReviewAction();

  async function toggle(id: number, hide: boolean) {
    try {
      await action.mutateAsync({ id, action: hide ? 'hide' : 'restore' });
      toast.success(hide ? 'Review hidden' : 'Review restored');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  }

  const items = reviews.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="font-display text-3xl font-extrabold">Reviews moderation</h1>
      {reviews.isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {!reviews.isLoading && items.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">No reviews on the platform yet.</Card>
      )}
      {items.map((r) => (
        <Card key={r.id} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{r.customer?.name ?? 'Anonymous'}</span>
                {r.car && <Badge variant="outline">{r.car.brand} {r.car.model}</Badge>}
                {r.company && <Badge variant="outline">{r.company.name}</Badge>}
                <Badge variant={r.status === 'visible' ? 'secondary' : 'outline'} className="capitalize">
                  {r.status}
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
                  <EyeOff className="h-3.5 w-3.5 mr-1" /> Hide
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => toggle(r.id, false)} disabled={action.isPending}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> Restore
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
  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="font-display text-3xl font-extrabold">Content</h1>
      <Card className="p-10 text-center text-muted-foreground">
        Content management (banners, blog, FAQ) is on the roadmap. Use Settings to control headline copy for now.
      </Card>
    </div>
  );
}

/* ============== FINANCE ============== */
export function AdminFinance() {
  const { currency, locale } = useApp();
  const overview = useAdminFinanceOverview();
  const payouts = useAdminPayouts({ limit: 50 });
  const process = useProcessPayout();

  async function pay(id: number) {
    const reference = window.prompt('Bank transfer reference?') ?? '';
    if (!reference.trim()) return;
    try {
      await process.mutateAsync({ id, reference });
      toast.success('Payout marked as paid');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  }

  const o = overview.data;
  const items = payouts.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      <h1 className="font-display text-3xl font-extrabold">Finance</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="GMV (this month)"
          value={o ? formatPrice(o.gmv_this_month, currency, locale) : '—'}
          icon={BadgeDollarSign}
          accent="success"
        />
        <StatCard
          label="Commission (this month)"
          value={o ? formatPrice(o.commission_this_month, currency, locale) : '—'}
          icon={BadgeDollarSign}
          accent="brand"
        />
        <StatCard label="Pending payouts" value={o?.pending_payouts ?? '—'} icon={BadgeDollarSign} accent="warning" />
        <StatCard label="Paid payouts" value={o?.paid_payouts ?? '—'} icon={CheckCircle2} accent="navy" />
      </div>

      <Card className="overflow-hidden">
        <div className="p-5 border-b font-display font-bold">Company payouts</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3 text-right">Gross</th>
              <th className="px-4 py-3 text-right">Commission</th>
              <th className="px-4 py-3 text-right">Net</th>
              <th className="px-4 py-3">Status</th>
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
                  No payouts yet
                </td>
              </tr>
            )}
            {items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3 font-semibold">{p.company?.name ?? `Company #${p.company_id}`}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{p.period}</td>
                <td className="px-4 py-3 text-right">{formatPrice(p.gross, currency, locale)}</td>
                <td className="px-4 py-3 text-right text-warning">−{formatPrice(p.commission, currency, locale)}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatPrice(p.net, currency, locale)}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="capitalize">
                    {p.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {p.status === 'pending' && (
                    <Button size="sm" variant="outline" onClick={() => pay(p.id)} disabled={process.isPending}>
                      Mark paid
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ============== SETTINGS ============== */
export function AdminSettings() {
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
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    }
  }

  if (settings.isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-6 w-6 mr-2 animate-spin" /> Loading settings...
      </div>
    );
  }

  const keys = Object.keys(draft).sort();

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="font-display text-3xl font-extrabold">Platform settings</h1>
      <form onSubmit={onSave}>
        <Card className="p-6 space-y-4">
          {keys.length === 0 && <p className="text-sm text-muted-foreground">No settings configured yet.</p>}
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
          {update.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save changes
        </Button>
      </form>
    </div>
  );
}
