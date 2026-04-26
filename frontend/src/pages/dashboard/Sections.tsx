import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Plus, MapPin, Star, FileText, AlertCircle, Clock } from 'lucide-react';
import { customers } from '@/mock/data';
import { useApp } from '@/store/app';
import { formatPrice, formatDate } from '@/lib/format';

export function DashCustomers() {
  const { currency, locale } = useApp();
  return (
    <div className="space-y-5 max-w-7xl">
      <h1 className="font-display text-3xl font-extrabold">Customers</h1>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Bookings</th>
              <th className="px-4 py-3 font-medium text-right">Lifetime value</th>
              <th className="px-4 py-3 font-medium">Last booking</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9"><AvatarFallback className="bg-gradient-brand text-white text-xs">{c.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</AvatarFallback></Avatar>
                    <div><div className="font-semibold">{c.name}</div><div className="text-xs text-muted-foreground">{c.email}</div></div>
                  </div>
                </td>
                <td className="px-4 py-3">{c.city}</td>
                <td className="px-4 py-3"><Badge variant="secondary">{c.totalBookings}</Badge></td>
                <td className="px-4 py-3 text-right font-semibold">{formatPrice(c.totalSpent, currency, locale)}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(c.lastBooking, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function DashBranches() {
  const branches = [
    { name: 'Ercan Havalimanı ofisi', address: 'Ercan Havalimanı, Geliş katı', hours: '06:00 - 24:00' },
    { name: 'Girne merkez şube', address: 'Naci Talat Cad. No:14, Girne', hours: '08:00 - 20:00' },
    { name: 'Gazimağusa şubesi', address: 'Salamis Yolu, Gazimağusa', hours: '09:00 - 19:00' },
  ];
  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold">Branches & locations</h1>
        <Button className="bg-gradient-brand text-white border-0"><Plus className="h-4 w-4 mr-1.5" />Add branch</Button>
      </div>
      <Card className="aspect-[16/8] bg-muted/30 flex items-center justify-center text-muted-foreground border-dashed">
        <div className="text-center"><MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />Map placeholder</div>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        {branches.map(b => (
          <Card key={b.name} className="p-5">
            <h3 className="font-display font-bold">{b.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{b.address}</p>
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
              <Clock className="h-3.5 w-3.5" /> {b.hours}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DashStaff() {
  const staff = [
    { name: 'Mehmet Özkan', email: 'mehmet@kyreniarent.com', role: 'manager' },
    { name: 'Selin Mertkan', email: 'selin@kyreniarent.com', role: 'agent' },
    { name: 'Hasan Tellioğlu', email: 'hasan@kyreniarent.com', role: 'agent' },
  ];
  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold">Staff</h1>
        <Button className="bg-gradient-brand text-white border-0"><Plus className="h-4 w-4 mr-1.5" />Invite member</Button>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Role</th></tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.email} className="border-t">
                <td className="px-4 py-3 font-semibold">{s.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{s.role}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function DashReviews() {
  const reviews = [
    { name: 'Mehmet Ö.', rating: 5, text: 'Ercan\'da bizi karşıladılar, araç tertemizdi. Tekrar tercih ederim.', car: 'Toyota Corolla' },
    { name: 'Sophie B.', rating: 4, text: 'Smooth pickup at Ercan, friendly team. Car was a bit dusty but otherwise great.', car: 'VW Polo' },
    { name: 'Иван П.', rating: 5, text: 'Отличный сервис, машину привезли прямо в отель в Кирении.', car: 'Hyundai Tucson' },
  ];
  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="font-display text-3xl font-extrabold">Reviews</h1>
      <div className="grid gap-4">
        {reviews.map((r, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2"><span className="font-semibold">{r.name}</span><Badge variant="outline">{r.car}</Badge></div>
                <div className="flex gap-0.5 my-1">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className={`h-4 w-4 ${j < r.rating ? 'fill-warning text-warning' : 'text-muted'}`} />)}</div>
                <p className="text-sm text-muted-foreground mt-2">{r.text}</p>
              </div>
              <Button size="sm" variant="outline">Reply</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DashPayouts() {
  const { currency, locale } = useApp();
  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="font-display text-3xl font-extrabold">Payouts</h1>
      <Card className="p-6">
        <h3 className="font-display font-bold mb-4">Bank account</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>IBAN</Label><Input placeholder="TR00 0000 0000 0000 0000 0000 00" /></div>
          <div><Label>Account holder</Label><Input placeholder="Kyrenia Rent A Car Ltd" /></div>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="p-5 border-b font-display font-bold">Payout history</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Period</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Invoice</th></tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map(i => (
              <tr key={i} className="border-t">
                <td className="px-4 py-3">2025-0{i}-01</td>
                <td className="px-4 py-3">Month {i}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatPrice(45000 + i * 5000, currency, locale)}</td>
                <td className="px-4 py-3"><Button size="sm" variant="ghost">Download PDF</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function DashDocuments() {
  const docs = [
    { name: 'Trade registry', status: 'valid', expires: '2026-12-01' },
    { name: 'Tax certificate', status: 'valid', expires: '2026-12-31' },
    { name: 'Operating license', status: 'expiring', expires: '2025-07-15' },
    { name: 'Insurance certificate', status: 'expiring', expires: '2025-06-30' },
  ];
  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="font-display text-3xl font-extrabold">Documents</h1>
      {docs.map(d => (
        <Card key={d.name} className="p-5 flex items-center gap-4">
          <FileText className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <div className="font-semibold">{d.name}</div>
            <div className="text-xs text-muted-foreground">Expires {d.expires}</div>
          </div>
          {d.status === 'expiring' && <AlertCircle className="h-4 w-4 text-warning" />}
          <Badge variant={d.status === 'valid' ? 'secondary' : 'outline'} className={d.status === 'expiring' ? 'border-warning text-warning' : ''}>{d.status}</Badge>
          <Button size="sm" variant="outline">Replace</Button>
        </Card>
      ))}
    </div>
  );
}

export function DashSettings() {
  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="font-display text-3xl font-extrabold">Settings</h1>
      <Card className="p-6">
        <h3 className="font-display font-bold mb-4">Company profile</h3>
        <div className="space-y-4">
          <div><Label>Company name</Label><Input defaultValue="Kyrenia Rent A Car" /></div>
          <div><Label>Description</Label><Textarea rows={3} defaultValue="Family-run rental company based in Girne. Serving Ercan Airport since 2009." /></div>
          <div><Label>Languages spoken</Label><Input defaultValue="Türkçe, English, Русский" /></div>
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="font-display font-bold mb-4">Notifications</h3>
        <Separator />
        {['New reservations', 'Reservation cancellations', 'Reviews', 'Payout updates', 'Marketing'].map(n => (
          <div key={n} className="flex items-center justify-between py-3 border-b last:border-0">
            <span className="text-sm">{n}</span>
            <Switch defaultChecked />
          </div>
        ))}
      </Card>
      <Card className="p-6 border-destructive/30">
        <h3 className="font-display font-bold mb-2 text-destructive">Danger zone</h3>
        <p className="text-sm text-muted-foreground mb-4">Permanently delete your company account.</p>
        <Button variant="destructive">Delete account</Button>
      </Card>
    </div>
  );
}
