import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
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
  const { currency, locale } = useApp();
  const stats = useCompanyStatistics();

  if (stats.isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-6 w-6 mr-2 animate-spin" /> Loading statistics...
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
        <h1 className="font-display text-3xl font-extrabold">Statistics</h1>
        <p className="text-muted-foreground mt-1">Performance insights from real bookings</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total bookings (12 mo)" value={totalBookings} icon={Repeat} accent="brand" />
        <StatCard
          label="Total revenue (12 mo)"
          value={formatPrice(totalRevenue, currency, locale)}
          icon={TrendingUp}
          accent="success"
        />
        <StatCard label="Avg booking value" value={formatPrice(avgBookingValue, currency, locale)} icon={Clock} accent="navy" />
        <StatCard label="Cancellation rate" value={cancelRate} icon={X} accent="warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-display font-bold text-lg mb-4">Revenue by month</h3>
          {monthly.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              No data yet — completed reservations will appear here.
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
          <h3 className="font-display font-bold text-lg mb-4">Bookings per month</h3>
          {monthly.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              No data yet.
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
          <h3 className="font-display font-bold text-lg mb-4">Reservations by status (last 90 days)</h3>
          {breakdownData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              No data yet.
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
          <h3 className="font-display font-bold text-lg mb-4">Top performing cars (last 90 days)</h3>
          {(data?.top_cars ?? []).length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              No data yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="text-left">
                  <th className="py-2">Car ID</th>
                  <th className="py-2">Bookings</th>
                  <th className="py-2 text-right">Revenue</th>
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
