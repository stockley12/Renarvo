import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { StatCard } from '@/components/dashboard/StatCard';
import { Building2, Car, Users, BadgeDollarSign, Star, Shield, Check, X, Flag, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { companies, cars, customers, reservations, monthlyRevenue, type CompanyStatus } from '@/mock/data';
import { useApp } from '@/store/app';
import { formatPrice, formatDate } from '@/lib/format';
import { useState } from 'react';

const statusBadge: Record<CompanyStatus, string> = {
  pending: 'bg-warning/15 text-warning border-warning/30',
  approved: 'bg-success/15 text-success border-success/30',
  suspended: 'bg-destructive/15 text-destructive border-destructive/30',
  rejected: 'bg-muted text-muted-foreground',
};

export function AdminOverview() {
  const { currency, locale } = useApp();
  const gmv = reservations.reduce((s, r) => s + r.totalPrice, 0);
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Platform overview</h1>
        <p className="text-muted-foreground mt-1">Renarvo at a glance</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="GMV (this month)" value={formatPrice(gmv, currency, locale)} icon={BadgeDollarSign} trend={18} accent="success" />
        <StatCard label="Commission earned" value={formatPrice(gmv * 0.12, currency, locale)} icon={BadgeDollarSign} trend={15} accent="brand" />
        <StatCard label="Active companies" value={companies.filter(c => c.status === 'approved').length} icon={Building2} accent="navy" />
        <StatCard label="Total cars" value={cars.length} hint={`${customers.length} customers`} icon={Car} accent="warning" />
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-display font-bold text-lg mb-4">GMV trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyRevenue}>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--brand-glow))" stopOpacity={0.5} /><stop offset="100%" stopColor="hsl(var(--brand-glow))" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--brand-glow))" strokeWidth={2.5} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="font-display font-bold text-lg mb-4">Bookings per month</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
              <Bar dataKey="bookings" fill="hsl(var(--brand))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card className="p-5">
        <h3 className="font-display font-bold text-lg mb-4">Top companies</h3>
        <div className="space-y-2">
          {companies.filter(c => c.status === 'approved').slice(0, 5).map(co => (
            <div key={co.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-xs" style={{ background: `hsl(${co.logoColor})` }}>{co.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</div>
              <div className="flex-1"><div className="font-semibold text-sm">{co.name}</div><div className="text-xs text-muted-foreground">{co.city} · {co.fleetSize} cars</div></div>
              <Badge variant="outline" className="gap-1"><Star className="h-3 w-3 fill-warning text-warning" /> {co.rating.toFixed(1)}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function AdminCompanies() {
  const [tab, setTab] = useState<CompanyStatus>('approved');
  const filtered = companies.filter(c => c.status === tab);
  return (
    <div className="space-y-5 max-w-7xl">
      <h1 className="font-display text-3xl font-extrabold">Companies</h1>
      <Tabs value={tab} onValueChange={(v) => setTab(v as CompanyStatus)}>
        <TabsList>
          {(['approved', 'pending', 'suspended', 'rejected'] as CompanyStatus[]).map(s => (
            <TabsTrigger key={s} value={s} className="capitalize">{s} <Badge variant="secondary" className="ml-2">{companies.filter(c => c.status === s).length}</Badge></TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3">Company</th><th className="px-4 py-3">City</th><th className="px-4 py-3">Fleet</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Status</th><th></th></tr></thead>
              <tbody>
                {filtered.map(co => (
                  <tr key={co.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: `hsl(${co.logoColor})` }}>{co.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</div><div className="font-semibold">{co.name}</div></div></td>
                    <td className="px-4 py-3">{co.city}</td>
                    <td className="px-4 py-3">{co.fleetSize}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-warning text-warning" /> {co.rating.toFixed(1)}</span></td>
                    <td className="px-4 py-3"><Badge variant="outline" className={statusBadge[co.status]}>{co.status}</Badge></td>
                    <td className="px-4 py-3 flex gap-2">
                      {co.status === 'pending' && <><Button size="sm" className="bg-success text-success-foreground"><Check className="h-3.5 w-3.5" /></Button><Button size="sm" variant="destructive"><X className="h-3.5 w-3.5" /></Button></>}
                      {co.status === 'approved' && <Button size="sm" variant="outline">Suspend</Button>}
                      <Button size="sm" variant="ghost">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function AdminApprovals() {
  const pending = companies.filter(c => c.status === 'pending');
  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="font-display text-3xl font-extrabold">Approvals queue</h1>
      <p className="text-muted-foreground">{pending.length} companies pending review</p>
      <div className="space-y-4">
        {pending.map(co => (
          <Card key={co.id} className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: `hsl(${co.logoColor})` }}>{co.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</div>
              <div className="flex-1">
                <h3 className="font-display font-bold">{co.name}</h3>
                <p className="text-sm text-muted-foreground">{co.city} · Founded {co.founded} · Fleet {co.fleetSize}</p>
                <p className="text-xs text-muted-foreground mt-1">Submitted {co.joined}</p>
                <div className="flex gap-2 mt-3 flex-wrap">{['Trade registry', 'Tax cert.', 'Operating license', 'Insurance'].map(d => <Badge key={d} variant="outline" className="gap-1"><FileText className="h-3 w-3" /> {d}</Badge>)}</div>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" className="bg-success text-success-foreground"><Check className="h-4 w-4 mr-1" />Approve</Button>
                <Button size="sm" variant="destructive"><X className="h-4 w-4 mr-1" />Reject</Button>
              </div>
            </div>
          </Card>
        ))}
        {pending.length === 0 && <Card className="p-12 text-center text-muted-foreground"><CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-success" />All caught up — no pending approvals</Card>}
      </div>
    </div>
  );
}

export function AdminCatalog() {
  const { currency, locale } = useApp();
  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between"><h1 className="font-display text-3xl font-extrabold">Catalog moderation</h1><Input placeholder="Search cars..." className="max-w-xs" /></div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3">Car</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">City</th><th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3">Actions</th></tr></thead>
          <tbody>
            {cars.slice(0, 20).map(c => {
              const co = companies.find(x => x.id === c.companyId);
              return (
                <tr key={c.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-semibold">{c.brand} {c.model} <span className="text-xs text-muted-foreground font-normal">({c.year})</span></td>
                  <td className="px-4 py-3">{co?.name}</td>
                  <td className="px-4 py-3">{c.city}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPrice(c.pricePerDay, currency, locale)}</td>
                  <td className="px-4 py-3 flex gap-1"><Button size="sm" variant="ghost"><Star className="h-3.5 w-3.5" /></Button><Button size="sm" variant="ghost"><Flag className="h-3.5 w-3.5" /></Button><Button size="sm" variant="ghost" className="text-destructive"><X className="h-3.5 w-3.5" /></Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function AdminReservations() {
  const { currency, locale } = useApp();
  return (
    <div className="space-y-5 max-w-7xl">
      <h1 className="font-display text-3xl font-extrabold">All reservations</h1>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Total</th></tr></thead>
          <tbody>
            {reservations.slice(0, 25).map(r => {
              const co = companies.find(c => c.id === r.companyId);
              return (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{r.code}</td>
                  <td className="px-4 py-3">{r.customerName}</td>
                  <td className="px-4 py-3">{co?.name}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{r.status}</Badge></td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPrice(r.totalPrice, currency, locale)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function AdminUsers() {
  const { currency, locale } = useApp();
  return (
    <div className="space-y-5 max-w-7xl">
      <h1 className="font-display text-3xl font-extrabold">Users</h1>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">City</th><th className="px-4 py-3">Bookings</th><th className="px-4 py-3 text-right">Spent</th><th className="px-4 py-3">Status</th><th></th></tr></thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarFallback className="bg-gradient-brand text-white text-xs">{c.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</AvatarFallback></Avatar><div><div className="font-semibold">{c.name}</div><div className="text-xs text-muted-foreground">{c.email}</div></div></div></td>
                <td className="px-4 py-3">{c.city}</td>
                <td className="px-4 py-3">{c.totalBookings}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatPrice(c.totalSpent, currency, locale)}</td>
                <td className="px-4 py-3"><Badge variant={c.status === 'active' ? 'secondary' : 'destructive'}>{c.status}</Badge></td>
                <td className="px-4 py-3"><Button size="sm" variant="ghost">{c.status === 'active' ? 'Ban' : 'Unban'}</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function AdminReviews() {
  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="font-display text-3xl font-extrabold">Reviews moderation</h1>
      {[1, 2, 3].map(i => (
        <Card key={i} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2"><span className="font-semibold">User {i}</span><Badge variant="outline" className="text-warning border-warning gap-1"><AlertTriangle className="h-3 w-3" /> Reported</Badge></div>
              <div className="flex gap-0.5 my-1">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className={`h-4 w-4 ${j < 2 ? 'fill-warning text-warning' : 'text-muted'}`} />)}</div>
              <p className="text-sm text-muted-foreground mt-2">Sample reported review content here...</p>
            </div>
            <div className="flex gap-2"><Button size="sm" variant="outline">Hide</Button><Button size="sm" variant="ghost">Restore</Button></div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function AdminContent() {
  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="font-display text-3xl font-extrabold">Content</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {['Homepage banners', 'Featured companies', 'Featured cars', 'Blog articles', 'Help articles', 'FAQ entries'].map(s => (
          <Card key={s} className="p-5"><h3 className="font-display font-bold mb-2">{s}</h3><p className="text-sm text-muted-foreground mb-4">Manage {s.toLowerCase()}.</p><Button variant="outline" size="sm">Manage</Button></Card>
        ))}
      </div>
    </div>
  );
}

export function AdminFinance() {
  const { currency, locale } = useApp();
  return (
    <div className="space-y-5 max-w-7xl">
      <h1 className="font-display text-3xl font-extrabold">Finance</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Commission rate" value="12%" icon={BadgeDollarSign} accent="brand" />
        <StatCard label="This month" value={formatPrice(280000, currency, locale)} icon={BadgeDollarSign} trend={15} accent="success" />
        <StatCard label="Pending payouts" value={formatPrice(145000, currency, locale)} icon={BadgeDollarSign} accent="warning" />
        <StatCard label="Tax (KDV) collected" value={formatPrice(420000, currency, locale)} icon={Shield} accent="navy" />
      </div>
      <Card className="overflow-hidden">
        <div className="p-5 border-b font-display font-bold">Payouts to companies</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3">Company</th><th className="px-4 py-3">Period</th><th className="px-4 py-3 text-right">Gross</th><th className="px-4 py-3 text-right">Commission</th><th className="px-4 py-3 text-right">Payout</th><th></th></tr></thead>
          <tbody>
            {companies.filter(c => c.status === 'approved').slice(0, 8).map(co => {
              const gross = 30000 + Math.floor(Math.random() * 70000);
              return (
                <tr key={co.id} className="border-t">
                  <td className="px-4 py-3 font-semibold">{co.name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">2025-04</td>
                  <td className="px-4 py-3 text-right">{formatPrice(gross, currency, locale)}</td>
                  <td className="px-4 py-3 text-right text-warning">-{formatPrice(gross * 0.12, currency, locale)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPrice(gross * 0.88, currency, locale)}</td>
                  <td className="px-4 py-3"><Button size="sm" variant="outline">Export</Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function AdminSettings() {
  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="font-display text-3xl font-extrabold">Platform settings</h1>
      <Card className="p-6">
        <h3 className="font-display font-bold mb-4">General</h3>
        <div className="space-y-4">
          <div><Label>Platform name</Label><Input defaultValue="Renarvo" /></div>
          <div><Label>Default commission %</Label><Input type="number" defaultValue="12" /></div>
          <div><Label>VAT rate (KDV)</Label><Input type="number" defaultValue="16" /></div>
          <div><Label>Supported currencies</Label><Input defaultValue="TRY, USD, EUR, RUB" /></div>
          <div><Label>Supported languages</Label><Input defaultValue="Türkçe, English, Русский" /></div>
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="font-display font-bold mb-4">Features</h3>
        <Separator />
        {['Allow new company signups', 'Auto-approve companies', 'Enable instant booking', 'Show featured carousel', 'Maintenance mode'].map(f => (
          <div key={f} className="flex items-center justify-between py-3 border-b last:border-0">
            <span className="text-sm">{f}</span>
            <Switch defaultChecked={!f.includes('Maintenance') && !f.includes('Auto-approve')} />
          </div>
        ))}
      </Card>
    </div>
  );
}
