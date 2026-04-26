import { useTranslation } from 'react-i18next';
import { TrendingUp, Car, CalendarCheck, Wallet, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { reservations, cars, monthlyRevenue } from '@/mock/data';
import { useApp } from '@/store/app';
import { formatPrice, formatDate } from '@/lib/format';
import { Link } from 'react-router-dom';

export default function DashOverview() {
  const { currency, locale } = useApp();
  const upcoming = reservations.filter(r => r.status === 'confirmed').slice(0, 5);
  const revenueMonth = monthlyRevenue[monthlyRevenue.length - 1].revenue;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Welcome back, Kyrenia Rent A Car</h1>
        <p className="text-muted-foreground mt-1">Here's how your business looks today</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue this month" value={formatPrice(revenueMonth, currency, locale)} icon={Wallet} trend={12} accent="success" />
        <StatCard label="Active rentals" value={18} hint="3 pickups today" icon={CalendarCheck} accent="brand" />
        <StatCard label="Fleet utilization" value="74%" trend={5} icon={TrendingUp} accent="navy" />
        <StatCard label="Cars in fleet" value={cars.filter(c => c.companyId === 'c1').length} hint="2 in maintenance" icon={Car} accent="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">Revenue trend</h3>
            <Badge variant="outline">Last 12 months</Badge>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyRevenue}>
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
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold text-lg mb-4">Alerts</h3>
          <div className="space-y-3">
            {[
              { msg: '2 reservations need confirmation', tone: 'warning' as const },
              { msg: '3 cars due for maintenance', tone: 'warning' as const },
              { msg: 'Insurance docs expire in 30 days', tone: 'destructive' as const },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-muted/40">
                <AlertCircle className={`h-4 w-4 mt-0.5 shrink-0 ${a.tone === 'destructive' ? 'text-destructive' : 'text-warning'}`} />
                <span className="text-sm">{a.msg}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg">Upcoming reservations</h3>
          <Button asChild variant="ghost" size="sm"><Link to="/dashboard/reservations">View all</Link></Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="pb-2 font-medium">Code</th>
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">Car</th>
                <th className="pb-2 font-medium">Pickup</th>
                <th className="pb-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map(r => {
                const car = cars.find(c => c.id === r.carId);
                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="py-3 font-mono text-xs font-semibold">{r.code}</td>
                    <td className="py-3">{r.customerName}</td>
                    <td className="py-3">{car?.brand} {car?.model}</td>
                    <td className="py-3 text-muted-foreground">{formatDate(r.pickupDate, locale)}</td>
                    <td className="py-3 text-right font-semibold">{formatPrice(r.totalPrice, currency, locale)}</td>
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
