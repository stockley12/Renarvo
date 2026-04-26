import { useState } from 'react';
import { Plus, Search, Edit, ImagePlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CarImage } from '@/components/brand/CarImage';
import { cars } from '@/mock/data';
import { useApp } from '@/store/app';
import { formatPrice } from '@/lib/format';

const statusColors: Record<string, string> = {
  active: 'bg-success/15 text-success border-success/30',
  draft: 'bg-muted text-muted-foreground',
  maintenance: 'bg-warning/15 text-warning border-warning/30',
  hidden: 'bg-muted text-muted-foreground',
};

function CarForm() {
  return (
    <div className="space-y-4 mt-6">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Brand</Label><Input placeholder="Toyota" /></div>
        <div><Label>Model</Label><Input placeholder="Corolla" /></div>
        <div><Label>Year</Label><Input type="number" placeholder="2024" /></div>
        <div><Label>Plate</Label><Input placeholder="34 AB 1234" /></div>
        <div><Label>VIN</Label><Input placeholder="JT..." /></div>
        <div><Label>Category</Label>
          <select className="h-10 w-full rounded-lg border bg-background px-3 text-sm"><option>Economy</option><option>Compact</option><option>SUV</option><option>Luxury</option></select>
        </div>
        <div><Label>Transmission</Label>
          <select className="h-10 w-full rounded-lg border bg-background px-3 text-sm"><option>Automatic</option><option>Manual</option></select>
        </div>
        <div><Label>Fuel</Label>
          <select className="h-10 w-full rounded-lg border bg-background px-3 text-sm"><option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Electric</option></select>
        </div>
        <div><Label>Seats</Label><Input type="number" placeholder="5" /></div>
        <div><Label>Doors</Label><Input type="number" placeholder="4" /></div>
        <div><Label>Daily price (₺)</Label><Input type="number" placeholder="800" /></div>
        <div><Label>Weekly price (₺)</Label><Input type="number" placeholder="5000" /></div>
        <div><Label>Deposit (₺)</Label><Input type="number" placeholder="3000" /></div>
        <div><Label>Min driver age</Label><Input type="number" placeholder="21" /></div>
      </div>
      <div><Label>Mileage policy</Label><Input placeholder="300 km/day included, ₺2/km after" /></div>
      <div><Label>Description</Label><Textarea rows={3} /></div>
      <div className="border-2 border-dashed rounded-xl p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
        <ImagePlus className="h-6 w-6 opacity-60" />
        Drop photos here or click to upload
      </div>
      <div className="flex gap-2 pt-4">
        <Button className="bg-gradient-brand text-white border-0">Save car</Button>
        <Button variant="outline">Save as draft</Button>
      </div>
    </div>
  );
}

export default function DashFleet() {
  const { currency, locale } = useApp();
  const [q, setQ] = useState('');
  const myCars = cars.filter(c => c.companyId === 'c1' && (c.brand + ' ' + c.model).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Fleet</h1>
          <p className="text-muted-foreground mt-1">{myCars.length} vehicles</p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button className="bg-gradient-brand text-white border-0"><Plus className="h-4 w-4 mr-1.5" /> Add car</Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-xl overflow-auto">
            <SheetHeader><SheetTitle>Add new car</SheetTitle></SheetHeader>
            <CarForm />
          </SheetContent>
        </Sheet>
      </div>

      <Card className="p-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by brand or model..." className="pl-9 border-0 bg-transparent" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Car</th>
                <th className="px-4 py-3 font-medium">Plate</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Price/day</th>
                <th className="px-4 py-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {myCars.map(c => (
                <tr key={c.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-16 rounded-lg overflow-hidden shrink-0"><CarImage seed={c.image} /></div>
                      <div>
                        <div className="font-semibold">{c.brand} {c.model}</div>
                        <div className="text-xs text-muted-foreground">{c.year} • {c.transmission}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{c.plate}</td>
                  <td className="px-4 py-3 capitalize">{c.category}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className={statusColors[c.status]}>{c.status}</Badge></td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPrice(c.pricePerDay, currency, locale)}</td>
                  <td className="px-4 py-3"><Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
