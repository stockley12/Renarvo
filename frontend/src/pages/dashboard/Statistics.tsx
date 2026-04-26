import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { monthlyRevenue, dailyBookings, categories } from '@/mock/data';
import { StatCard } from '@/components/dashboard/StatCard';
import { TrendingUp, Clock, X, Repeat } from 'lucide-react';

const pieColors = ['hsl(var(--brand))', 'hsl(var(--brand-glow))', 'hsl(var(--navy))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(262 70% 55%)'];

export default function DashStats() {
  const catData = categories.map((c, i) => ({ name: c.nameTr, value: 10 + Math.floor(Math.random() * 50) }));
  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Statistics</h1>
        <p className="text-muted-foreground mt-1">Performance insights for your business</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Avg. rental duration" value="4.2 days" icon={Clock} accent="brand" />
        <StatCard label="Cancellation rate" value="3.1%" trend={-1} icon={X} accent="warning" />
        <StatCard label="Repeat customers" value="42%" trend={5} icon={Repeat} accent="success" />
        <StatCard label="Conversion rate" value="8.7%" trend={2} icon={TrendingUp} accent="navy" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-display font-bold text-lg mb-4">Revenue by month</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
              <Bar dataKey="revenue" fill="hsl(var(--brand))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold text-lg mb-4">Bookings (last 30 days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailyBookings}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
              <Line type="monotone" dataKey="bookings" stroke="hsl(var(--brand-glow))" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold text-lg mb-4">Bookings by category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={catData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                {catData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold text-lg mb-4">Occupancy heatmap</h3>
          <div className="grid grid-cols-12 gap-1">
            {Array.from({ length: 84 }).map((_, i) => {
              const v = Math.random();
              return (
                <div
                  key={i}
                  className="aspect-square rounded"
                  style={{ background: `hsl(var(--brand) / ${0.1 + v * 0.9})` }}
                  title={`${Math.round(v * 100)}%`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-3"><span>Week 1</span><span>Week 12</span></div>
        </Card>
      </div>
    </div>
  );
}
