import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { TrendingUp, Clock, X, Repeat, Loader2 } from 'lucide-react';
import { useCompanyStatistics } from '@/lib/hooks/useCompany';
import { useApp } from '@/store/app';
import { formatPrice } from '@/lib/format';

const pieColors = [
  'hsl(var(--brand))',
  'hsl(var(--brand-glow))',
  'hsl(var(--navy))',
  'hsl(var(--warning))',
  'hsl(var(--success))',
  'hsl(262 70% 55%)',
];

export default function DashStats() {
  const { t } = useTranslation();
  const { currency, locale } = useApp();
  const stats = useCompanyStatistics();

  if (stats.isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-6 w-6 mr-2 animate-spin" /> {t('panel.company.stats.loading')}
      </div>
    );
  }

  const data = stats.data;
  const monthly = data?.monthly ?? [];
  const statusBreakdown = data?.status_breakdown ?? {};
  const breakdownData = Object.entries(statusBreakdown).map(([k, v]) => ({ name: k, value: Number(v) }));

  const totalRevenue = monthly.reduce((acc, m) => acc + Number(m.revenue || 0), 0);
  const totalBookings = monthly.reduce((acc, m) => acc + Number(m.bookings || 0), 0);
  const completed = Number(statusBreakdown.completed ?? 0);
  const cancelled = Number(statusBreakdown.cancelled ?? 0);
  const cancelRate = totalBookings > 0 ? ((cancelled / totalBookings) * 100).toFixed(1) + '%' : '0%';
  const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{t('panel.company.nav.statistics')}</h1>
        <p className="text-muted-foreground mt-1">{t('panel.company.stats.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('panel.company.stats.totalBookings12m')} value={totalBookings} icon={Repeat} accent="brand" />
        <StatCard
          label={t('panel.company.stats.totalRevenue12m')}
          value={formatPrice(totalRevenue, currency, locale)}
          icon={TrendingUp}
          accent="success"
        />
        <StatCard label={t('panel.company.stats.avgBookingValue')} value={formatPrice(avgBookingValue, currency, locale)} icon={Clock} accent="navy" />
        <StatCard label={t('panel.company.stats.cancellationRate')} value={cancelRate} icon={X} accent="warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-display font-bold text-lg mb-4">{t('panel.company.stats.revenueByMonth')}</h3>
          {monthly.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              {t('panel.company.stats.noDataWithHint')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                <Bar dataKey="revenue" fill="hsl(var(--brand))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold text-lg mb-4">{t('panel.company.stats.bookingsByMonth')}</h3>
          {monthly.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              {t('panel.company.stats.noData')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                <Bar dataKey="bookings" fill="hsl(var(--brand-glow))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold text-lg mb-4">{t('panel.company.stats.statusBreakdown90d')}</h3>
          {breakdownData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              {t('panel.company.stats.noData')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={breakdownData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                  {breakdownData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold text-lg mb-4">{t('panel.company.stats.topCars90d')}</h3>
          {(data?.top_cars ?? []).length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              {t('panel.company.stats.noData')}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="text-left">
                  <th className="py-2">{t('panel.company.stats.carId')}</th>
                  <th className="py-2">{t('panel.company.stats.bookings')}</th>
                  <th className="py-2 text-right">{t('panel.company.stats.revenue')}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.top_cars ?? []).map((c) => (
                  <tr key={c.car_id} className="border-t">
                    <td className="py-2 font-mono text-xs">#{c.car_id}</td>
                    <td className="py-2">{c.bookings}</td>
                    <td className="py-2 text-right font-semibold">
                      {formatPrice(c.revenue, currency, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
