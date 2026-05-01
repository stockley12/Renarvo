import { TrendingUp, Car, CalendarCheck, Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { useApp } from '@/store/app';
import { formatPrice, formatDate } from '@/lib/format';
import { Link } from 'react-router-dom';
import { useCompanyOverview, useCompanyStatistics, useCompanySettings } from '@/lib/hooks/useCompany';

export default function DashOverview() {
  const { t } = useTranslation();
  const { currency, locale } = useApp();
  const overview = useCompanyOverview();
  const stats = useCompanyStatistics();
  const settings = useCompanySettings();

  if (overview.isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-6 w-6 mr-2 animate-spin" /> Loading overview...
        
      </div>
    );
  }

  if (overview.isError || !overview.data) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-extrabold">{t('panel.company.overview.unavailable')}</h1>
        <p className="text-muted-foreground">{(overview.error as Error)?.message ?? t('panel.company.overview.loadFailed')}</p>
      </div>
    );
  }

  const { stats: o, recent_reservations } = overview.data;
  const monthly = stats.data?.monthly ?? [];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-display text-3xl font-extrabold">
          Welcome back{settings.data?.name ? `, ${settings.data.name}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">{t('panel.company.overview.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('panel.company.overview.revenueThisMonth')}
          value={formatPrice(o.revenue_this_month, currency, locale)}
          icon={Wallet}
          accent="success"
        />
        <StatCard label={t('panel.company.overview.activeRentals')} value={o.reservations_active} icon={CalendarCheck} accent="brand" />
        <StatCard label={t('panel.company.overview.pickupsToday')} value={o.reservations_today} icon={TrendingUp} accent="navy" />
        <StatCard label={t('panel.company.overview.carsInFleet')} value={o.fleet_size} icon={Car} accent="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">{t('panel.company.overview.revenueTrend')}</h3>
            <Badge variant="outline">{t('panel.company.overview.last12Months')}</Badge>
          </div>
          {monthly.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              {t('panel.company.overview.noRevenueData')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--brand))" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold text-lg mb-4">{t('panel.company.overview.alerts')}</h3>
          <div className="space-y-3">
            {o.reservations_pending > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
                <span className="text-sm">
                  {t('panel.company.overview.pendingReservations', { count: o.reservations_pending })}
                </span>
              </div>
            )}
            {o.fleet_size === 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
                <span className="text-sm">
                  {t('panel.company.overview.emptyFleet')}{' '}
                  <Link to="/dashboard/fleet" className="text-primary underline">
                    {t('panel.company.overview.addFirstCar')}
                  </Link>
                </span>
              </div>
            )}
            {o.reservations_pending === 0 && o.fleet_size > 0 && (
              <p className="text-sm text-muted-foreground">{t('panel.company.overview.allClear')}</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg">{t('panel.company.overview.recentReservations')}</h3>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/reservations">{t('common.viewAll')}</Link>
          </Button>
        </div>
        {recent_reservations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('panel.company.overview.noReservations')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="pb-2 font-medium">{t('panel.common.code')}</th>
                  <th className="pb-2 font-medium">{t('panel.common.customer')}</th>
                  <th className="pb-2 font-medium">{t('panel.common.car')}</th>
                  <th className="pb-2 font-medium">{t('panel.common.pickup')}</th>
                  <th className="pb-2 font-medium">{t('panel.common.status')}</th>
                  <th className="pb-2 font-medium text-right">{t('common.total')}</th>
                </tr>
              </thead>
              <tbody>
                {recent_reservations.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="py-3 font-mono text-xs font-semibold">{r.code}</td>
                    <td className="py-3">{r.customer_name ?? '—'}</td>
                    <td className="py-3">{r.car_label ?? '—'}</td>
                    <td className="py-3 text-muted-foreground">{formatDate(r.pickup_at, locale)}</td>
                    <td className="py-3">
                      <Badge variant="outline" className="capitalize">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right font-semibold">{formatPrice(r.total_price, currency, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
