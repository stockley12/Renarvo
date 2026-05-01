import { useState } from 'react';
import { Plus, Search, Edit, ImagePlus, Trash2, Loader2, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { CarImage } from '@/components/brand/CarImage';
import { useApp } from '@/store/app';
import { formatPrice, storageUrl } from '@/lib/format';
import { toast } from 'sonner';
import {
  useCompanyCars,
  useCreateCar,
  useUpdateCar,
  useDeleteCar,
  uploadCarImage,
  useDeleteCarImage,
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
  min_driver_age_override: null,
  engine_power_hp: null,
  engine_cc: null,
  has_ac: true,
  kilometre_limit_per_day: null,
  features: [],
};

interface CarFormProps {
  initial?: Partial<CarPayload>;
  carId?: number;
  existingImages?: ApiCar['images'];
  onClose: () => void;
}

function CarForm({ initial, carId, existingImages, onClose }: CarFormProps) {
  const [payload, setPayload] = useState<CarPayload>({ ...initialPayload, ...initial });
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const create = useCreateCar();
  const update = useUpdateCar();
  const deleteImage = useDeleteCarImage();

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

      if (pendingImages.length > 0) {
        setUploading(true);
        let failures = 0;
        for (const file of pendingImages) {
          try {
            await uploadCarImage(car.id, file);
          } catch {
            failures++;
          }
        }
        setUploading(false);
        if (failures > 0) {
          toast.error(`Car saved, but ${failures} image(s) failed to upload`);
        }
      }

      toast.success(carId ? 'Car updated' : 'Car created');
      onClose();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Could not save car';
      toast.error(msg);
    }
  }

  async function onDeleteExistingImage(imageId: number) {
    if (!carId) return;
    if (!window.confirm('Remove this image?')) return;
    try {
      await deleteImage.mutateAsync({ carId, imageId });
      toast.success('Image removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove image');
    }
  }

  const submitting = create.isPending || update.isPending || uploading;

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
            <option value="comfort">Comfort</option>
            <option value="prestige">Prestige</option>
            <option value="premium">Premium</option>
            <option value="luxury">Luxury</option>
            <option value="suv">SUV</option>
            <option value="minivan">Minivan</option>
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
          <Label>Min driver age (default)</Label>
          <Input
            type="number"
            value={payload.min_driver_age ?? ''}
            onChange={(e) => set('min_driver_age', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
        <div>
          <Label>Min driver age (override)</Label>
          <Input
            type="number"
            value={payload.min_driver_age_override ?? ''}
            placeholder="Use company default"
            onChange={(e) => set('min_driver_age_override', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
        <div>
          <Label>Engine power (HP)</Label>
          <Input
            type="number"
            value={payload.engine_power_hp ?? ''}
            placeholder="e.g. 130"
            onChange={(e) => set('engine_power_hp', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
        <div>
          <Label>Engine size (cc)</Label>
          <Input
            type="number"
            value={payload.engine_cc ?? ''}
            placeholder="e.g. 1600"
            onChange={(e) => set('engine_cc', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
        <div>
          <Label>Daily km limit (this car)</Label>
          <Input
            type="number"
            value={payload.kilometre_limit_per_day ?? ''}
            placeholder="Use company default"
            onChange={(e) => set('kilometre_limit_per_day', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
        <div className="flex items-end gap-3 pb-1">
          <div className="flex flex-col">
            <Label className="mb-2">Air conditioning</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={payload.has_ac ?? true}
                onCheckedChange={(v) => set('has_ac', v)}
              />
              <span className="text-sm text-muted-foreground">{payload.has_ac ? 'A/C included' : 'No A/C'}</span>
            </div>
          </div>
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
        <Label>Photo gallery (interior + exterior)</Label>
        {existingImages && existingImages.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2 mb-3">
            {existingImages.map((img) => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden border bg-muted/30 aspect-[4/3]">
                <img
                  src={storageUrl(img.path) ?? ''}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => onDeleteExistingImage(img.id)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {pendingImages.length > 0 && (
          <div className="text-xs text-muted-foreground mb-2">
            {pendingImages.length} new image(s) ready to upload:&nbsp;
            <span className="text-foreground">{pendingImages.map((f) => f.name).join(', ')}</span>
          </div>
        )}
        <label className="border-2 border-dashed rounded-xl p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2 cursor-pointer hover:border-primary transition-colors">
          <ImagePlus className="h-6 w-6 opacity-60" />
          Click or drop multiple JPG / PNG / WEBP (max 5 MB each)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              const valid: File[] = [];
              for (const f of files) {
                if (f.size > 5 * 1024 * 1024) {
                  toast.error(`${f.name} is too large (max 5 MB)`);
                  continue;
                }
                valid.push(f);
              }
              if (valid.length > 0) {
                setPendingImages((p) => [...p, ...valid]);
              }
              e.target.value = '';
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
              existingImages={editing.images}
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
                min_driver_age: editing.min_driver_age ?? null,
                min_driver_age_override: editing.min_driver_age_override ?? null,
                engine_power_hp: editing.engine_power_hp ?? null,
                engine_cc: editing.engine_cc ?? null,
                has_ac: editing.has_ac ?? true,
                kilometre_limit_per_day: editing.kilometre_limit_per_day ?? null,
              }}
              onClose={() => setEditing(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
