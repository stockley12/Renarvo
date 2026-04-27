import { useState } from 'react';
import { Plus, Search, Edit, ImagePlus, Trash2, Loader2, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CarImage } from '@/components/brand/CarImage';
import { useApp } from '@/store/app';
import { formatPrice } from '@/lib/format';
import { toast } from 'sonner';
import {
  useCompanyCars,
  useCreateCar,
  useUpdateCar,
  useDeleteCar,
  uploadCarImage,
  type CarPayload,
} from '@/lib/hooks/useCompany';
import type { ApiCar } from '@/lib/api';
import { ApiClientError } from '@/lib/api';

const statusColors: Record<string, string> = {
  active: 'bg-success/15 text-success border-success/30',
  draft: 'bg-muted text-muted-foreground',
  maintenance: 'bg-warning/15 text-warning border-warning/30',
  hidden: 'bg-muted text-muted-foreground',
};

const initialPayload: CarPayload = {
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  category: 'economy',
  transmission: 'automatic',
  fuel: 'petrol',
  seats: 5,
  doors: 4,
  price_per_day: 0,
  weekly_price: null,
  city: 'Girne',
  deposit: null,
  mileage_policy: '',
  status: 'active',
  plate: '',
  vin: '',
  description: '',
  min_driver_age: 21,
  features: [],
};

interface CarFormProps {
  initial?: Partial<CarPayload>;
  carId?: number;
  onClose: () => void;
}

function CarForm({ initial, carId, onClose }: CarFormProps) {
  const [payload, setPayload] = useState<CarPayload>({ ...initialPayload, ...initial });
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const create = useCreateCar();
  const update = useUpdateCar();

  function set<K extends keyof CarPayload>(key: K, value: CarPayload[K]) {
    setPayload((p) => ({ ...p, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!payload.brand || !payload.model || payload.price_per_day <= 0) {
      toast.error('Brand, model and price per day are required');
      return;
    }

    try {
      const car = carId
        ? await update.mutateAsync({ id: carId, input: payload })
        : await create.mutateAsync(payload);

      if (pendingImage) {
        try {
          await uploadCarImage(car.id, pendingImage);
        } catch (err) {
          toast.error('Car saved, but image upload failed: ' + (err instanceof Error ? err.message : 'unknown error'));
        }
      }

      toast.success(carId ? 'Car updated' : 'Car created');
      onClose();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Could not save car';
      toast.error(msg);
    }
  }

  const submitting = create.isPending || update.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-6">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Brand</Label>
          <Input value={payload.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Toyota" required />
        </div>
        <div>
          <Label>Model</Label>
          <Input value={payload.model} onChange={(e) => set('model', e.target.value)} placeholder="Corolla" required />
        </div>
        <div>
          <Label>Year</Label>
          <Input type="number" value={payload.year} onChange={(e) => set('year', parseInt(e.target.value) || 0)} required />
        </div>
        <div>
          <Label>Plate</Label>
          <Input value={payload.plate ?? ''} onChange={(e) => set('plate', e.target.value)} placeholder="34 AB 1234" />
        </div>
        <div>
          <Label>VIN</Label>
          <Input value={payload.vin ?? ''} onChange={(e) => set('vin', e.target.value)} />
        </div>
        <div>
          <Label>Category</Label>
          <select
            value={payload.category}
            onChange={(e) => set('category', e.target.value as CarPayload['category'])}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="economy">Economy</option>
            <option value="compact">Compact</option>
            <option value="suv">SUV</option>
            <option value="luxury">Luxury</option>
            <option value="van">Van</option>
            <option value="electric">Electric</option>
          </select>
        </div>
        <div>
          <Label>Transmission</Label>
          <select
            value={payload.transmission}
            onChange={(e) => set('transmission', e.target.value as CarPayload['transmission'])}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div>
          <Label>Fuel</Label>
          <select
            value={payload.fuel}
            onChange={(e) => set('fuel', e.target.value as CarPayload['fuel'])}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
          </select>
        </div>
        <div>
          <Label>Seats</Label>
          <Input type="number" value={payload.seats} onChange={(e) => set('seats', parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <Label>Doors</Label>
          <Input type="number" value={payload.doors} onChange={(e) => set('doors', parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <Label>City</Label>
          <Input value={payload.city} onChange={(e) => set('city', e.target.value)} placeholder="Girne" required />
        </div>
        <div>
          <Label>Daily price (₺)</Label>
          <Input
            type="number"
            value={payload.price_per_day}
            onChange={(e) => set('price_per_day', parseInt(e.target.value) || 0)}
            required
          />
        </div>
        <div>
          <Label>Weekly price (₺)</Label>
          <Input
            type="number"
            value={payload.weekly_price ?? ''}
            onChange={(e) => set('weekly_price', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
        <div>
          <Label>Deposit (₺)</Label>
          <Input
            type="number"
            value={payload.deposit ?? ''}
            onChange={(e) => set('deposit', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
        <div>
          <Label>Min driver age</Label>
          <Input
            type="number"
            value={payload.min_driver_age ?? ''}
            onChange={(e) => set('min_driver_age', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
        <div className="col-span-2">
          <Label>Status</Label>
          <select
            value={payload.status ?? 'active'}
            onChange={(e) => set('status', e.target.value as CarPayload['status'])}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="maintenance">Maintenance</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </div>
      <div>
        <Label>Mileage policy</Label>
        <Input
          value={payload.mileage_policy ?? ''}
          onChange={(e) => set('mileage_policy', e.target.value)}
          placeholder="300 km/day included, ₺2/km after"
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          rows={3}
          value={payload.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>
      <div>
        <Label>Image</Label>
        <label className="border-2 border-dashed rounded-xl p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2 cursor-pointer hover:border-primary transition-colors">
          <ImagePlus className="h-6 w-6 opacity-60" />
          {pendingImage ? `${pendingImage.name} ready to upload` : 'Click or drop a JPG / PNG / WEBP (max 5 MB)'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                if (f.size > 5 * 1024 * 1024) {
                  toast.error('Image is too large (max 5 MB)');
                  return;
                }
                setPendingImage(f);
              }
            }}
          />
        </label>
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={submitting} className="bg-gradient-brand text-white border-0">
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {carId ? 'Save changes' : 'Create car'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function DashFleet() {
  const { currency, locale } = useApp();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<ApiCar | null>(null);
  const [creating, setCreating] = useState(false);
  const cars = useCompanyCars({ search: q || undefined, limit: 100 });
  const deleteCar = useDeleteCar();

  async function onDelete(id: number) {
    if (!window.confirm('Delete this car? This cannot be undone.')) return;
    try {
      await deleteCar.mutateAsync(id);
      toast.success('Car deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete car');
    }
  }

  const myCars = cars.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Fleet</h1>
          <p className="text-muted-foreground mt-1">{cars.data?.meta.total ?? 0} vehicles</p>
        </div>
        <Sheet open={creating} onOpenChange={setCreating}>
          <SheetTrigger asChild>
            <Button className="bg-gradient-brand text-white border-0">
              <Plus className="h-4 w-4 mr-1.5" /> Add car
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-xl overflow-auto">
            <SheetHeader>
              <SheetTitle>Add new car</SheetTitle>
            </SheetHeader>
            {creating && <CarForm onClose={() => setCreating(false)} />}
          </SheetContent>
        </Sheet>
      </div>

      <Card className="p-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by brand, model or plate..."
            className="pl-9 border-0 bg-transparent"
          />
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
                <th className="px-4 py-3 font-medium w-24"></th>
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
              {!cars.isLoading && myCars.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="text-muted-foreground mb-3">No cars yet</div>
                    <Button className="bg-gradient-brand text-white border-0" onClick={() => setCreating(true)}>
                      <Plus className="h-4 w-4 mr-1.5" /> Add your first car
                    </Button>
                  </td>
                </tr>
              )}
              {myCars.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-16 rounded-lg overflow-hidden shrink-0">
                        <CarImage seed={c.image_seed ?? `${c.brand}-${c.model}`} />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {c.brand} {c.model}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.year} • {c.transmission}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">—</td>
                  <td className="px-4 py-3 capitalize">{c.category}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={statusColors[c.status] ?? ''}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPrice(c.price_per_day, currency, locale)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(c)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(c.id)}
                        disabled={deleteCar.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4" /> Edit car
              <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setEditing(null)}>
                <X className="h-4 w-4" />
              </Button>
            </SheetTitle>
          </SheetHeader>
          {editing && (
            <CarForm
              carId={editing.id}
              initial={{
                brand: editing.brand,
                model: editing.model,
                year: editing.year,
                category: editing.category as CarPayload['category'],
                transmission: editing.transmission,
                fuel: editing.fuel as CarPayload['fuel'],
                seats: editing.seats,
                doors: editing.doors,
                price_per_day: editing.price_per_day,
                weekly_price: editing.weekly_price ?? null,
                city: editing.city,
                deposit: editing.deposit,
                mileage_policy: editing.mileage_policy ?? '',
                description: editing.description ?? '',
                status: editing.status as CarPayload['status'],
                features: editing.features ?? [],
              }}
              onClose={() => setEditing(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
