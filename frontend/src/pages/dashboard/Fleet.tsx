import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

const PREDEFINED_BRANDS = [
  'Toyota', 'Hyundai', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Renault',
  'Fiat', 'Peugeot', 'Kia', 'Nissan', 'Honda', 'Ford', 'Opel', 'Citroen',
  'Skoda', 'Seat', 'Dacia', 'Volvo', 'Mazda', 'Suzuki', 'Mitsubishi',
  'Land Rover', 'Jeep', 'Tesla', 'MG', 'Cupra', 'Mini',
];

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
  const { t } = useTranslation();
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
      toast.error(t('panel.company.fleet.toasts.brandModelPriceRequired'));
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
          toast.error(t('panel.company.fleet.toasts.imagesFailed', { count: failures }));
        }
      }

      toast.success(carId ? t('panel.company.fleet.toasts.carUpdated') : t('panel.company.fleet.toasts.carCreated'));
      onClose();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : t('panel.company.fleet.toasts.couldNotSaveCar');
      toast.error(msg);
    }
  }

  async function onDeleteExistingImage(imageId: number) {
    if (!carId) return;
    if (!window.confirm(t('panel.company.fleet.confirms.removeImage'))) return;
    try {
      await deleteImage.mutateAsync({ carId, imageId });
      toast.success(t('panel.company.fleet.toasts.imageRemoved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.fleet.toasts.couldNotRemoveImage'));
    }
  }

  const submitting = create.isPending || update.isPending || uploading;

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>{t('panel.company.fleet.form.brand')}</Label>
          <Input value={payload.brand} onChange={(e) => set('brand', e.target.value)} placeholder={t('panel.company.fleet.form.brandPlaceholder')} required list="brand-suggestions" />
          <datalist id="brand-suggestions">
            {PREDEFINED_BRANDS.map((b) => <option key={b} value={b} />)}
          </datalist>
        </div>
        <div>
          <Label>{t('panel.company.fleet.form.model')}</Label>
          <Input value={payload.model} onChange={(e) => set('model', e.target.value)} placeholder={t('panel.company.fleet.form.modelPlaceholder')} required />
        </div>
        <div>
          <Label>{t('panel.company.fleet.form.year')}</Label>
          <Input type="number" value={payload.year} onChange={(e) => set('year', parseInt(e.target.value) || 0)} required />
        </div>
        <div>
          <Label>{t('panel.company.fleet.form.plate')}</Label>
          <Input value={payload.plate ?? ''} onChange={(e) => set('plate', e.target.value)} placeholder={t('panel.company.fleet.form.platePlaceholder')} />
        </div>
        <div>
          <Label>{t('panel.company.fleet.form.vin')}</Label>
          <Input value={payload.vin ?? ''} onChange={(e) => set('vin', e.target.value)} />
        </div>
        <div>
          <Label>{t('cars.category')}</Label>
          <select
            value={payload.category}
            onChange={(e) => set('category', e.target.value as CarPayload['category'])}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="economy">{t('nav.categories.economy')}</option>
            <option value="compact">{t('nav.categories.compact')}</option>
            <option value="comfort">{t('nav.categories.comfort')}</option>
            <option value="prestige">{t('nav.categories.prestige')}</option>
            <option value="premium">{t('nav.categories.premium')}</option>
            <option value="luxury">{t('nav.categories.luxury')}</option>
            <option value="suv">{t('nav.categories.suv')}</option>
            <option value="minivan">{t('nav.categories.minivan')}</option>
            <option value="van">{t('nav.categories.van')}</option>
            <option value="electric">{t('nav.categories.electric')}</option>
          </select>
        </div>
        <div>
          <Label>{t('cars.transmission')}</Label>
          <select
            value={payload.transmission}
            onChange={(e) => set('transmission', e.target.value as CarPayload['transmission'])}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="automatic">{t('panel.company.fleet.transmission.automatic')}</option>
            <option value="manual">{t('panel.company.fleet.transmission.manual')}</option>
            <option value="semi_automatic">{t('panel.company.fleet.transmission.semi_automatic')}</option>
          </select>
        </div>
        <div>
          <Label>{t('cars.fuel')}</Label>
          <select
            value={payload.fuel}
            onChange={(e) => set('fuel', e.target.value as CarPayload['fuel'])}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="petrol">{t('panel.company.fleet.fuel.petrol')}</option>
            <option value="diesel">{t('panel.company.fleet.fuel.diesel')}</option>
            <option value="hybrid">{t('panel.company.fleet.fuel.hybrid')}</option>
            <option value="electric">{t('panel.company.fleet.fuel.electric')}</option>
          </select>
        </div>
        <div>
          <Label>{t('cars.seats')}</Label>
          <Input type="number" value={payload.seats} onChange={(e) => set('seats', parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <Label>{t('panel.company.fleet.form.doors')}</Label>
          <Input type="number" value={payload.doors} onChange={(e) => set('doors', parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <Label>{t('common.city')}</Label>
          <Input value={payload.city} onChange={(e) => set('city', e.target.value)} placeholder={t('panel.company.fleet.form.cityPlaceholder')} required />
        </div>
        <div>
          <Label>{t('panel.company.fleet.form.dailyPrice')}</Label>
          <Input
            type="number"
            value={payload.price_per_day}
            onChange={(e) => set('price_per_day', parseInt(e.target.value) || 0)}
            required
          />
        </div>
        <div>
          <Label>{t('panel.company.fleet.form.weeklyPrice')}</Label>
          <Input
            type="number"
            value={payload.weekly_price ?? ''}
            onChange={(e) => set('weekly_price', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
        <div>
          <Label>{t('panel.company.fleet.form.deposit')}</Label>
          <Input
            type="number"
            value={payload.deposit ?? ''}
            onChange={(e) => set('deposit', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
        <div>
          <Label>{t('panel.company.fleet.form.minDriverAgeDefault')}</Label>
          <Input
            type="number"
            value={payload.min_driver_age ?? ''}
            onChange={(e) => set('min_driver_age', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
        <div>
          <Label>{t('panel.company.fleet.form.minDriverAgeOverride')}</Label>
          <Input
            type="number"
            value={payload.min_driver_age_override ?? ''}
            placeholder={t('panel.company.fleet.form.useCompanyDefault')}
            onChange={(e) => set('min_driver_age_override', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
        <div>
          <Label>{t('panel.company.fleet.form.enginePower')}</Label>
          <Input
            type="number"
            value={payload.engine_power_hp ?? ''}
            placeholder={t('panel.company.fleet.form.enginePowerPlaceholder')}
            onChange={(e) => set('engine_power_hp', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
        <div>
          <Label>{t('panel.company.fleet.form.engineSize')}</Label>
          <Input
            type="number"
            value={payload.engine_cc ?? ''}
            placeholder={t('panel.company.fleet.form.engineSizePlaceholder')}
            onChange={(e) => set('engine_cc', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
        <div>
          <Label>{t('panel.company.fleet.form.dailyKmLimit')}</Label>
          <Input
            type="number"
            value={payload.kilometre_limit_per_day ?? ''}
            placeholder={t('panel.company.fleet.form.useCompanyDefault')}
            onChange={(e) => set('kilometre_limit_per_day', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
        <div className="flex items-end gap-3 pb-1">
          <div className="flex flex-col">
            <Label className="mb-2">{t('carDetail.ac')}</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={payload.has_ac ?? true}
                onCheckedChange={(v) => set('has_ac', v)}
              />
              <span className="text-sm text-muted-foreground">{payload.has_ac ? t('carDetail.acYes') : t('carDetail.acNo')}</span>
            </div>
          </div>
        </div>
        <div className="col-span-2">
          <Label>{t('panel.common.status')}</Label>
          <select
            value={payload.status ?? 'active'}
            onChange={(e) => set('status', e.target.value as CarPayload['status'])}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
          >
            <option value="active">{t('panel.company.fleet.status.active')}</option>
            <option value="draft">{t('panel.company.fleet.status.draft')}</option>
            <option value="maintenance">{t('panel.company.fleet.status.maintenance')}</option>
            <option value="hidden">{t('panel.company.fleet.status.hidden')}</option>
          </select>
        </div>
      </div>
      <div>
        <Label>{t('panel.company.fleet.form.mileagePolicy')}</Label>
        <Input
          value={payload.mileage_policy ?? ''}
          onChange={(e) => set('mileage_policy', e.target.value)}
          placeholder={t('panel.company.fleet.form.mileagePolicyPlaceholder')}
        />
      </div>
      <div>
        <Label>{t('auth.registerCompany.description')}</Label>
        <Textarea
          rows={3}
          value={payload.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>
      <div>
        <Label>{t('panel.company.fleet.form.photoGallery')}</Label>
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
                  aria-label={t('panel.company.fleet.form.deleteImageAria')}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {pendingImages.length > 0 && (
          <div className="text-xs text-muted-foreground mb-2">
            {t('panel.company.fleet.form.pendingImages', { count: pendingImages.length })}&nbsp;
            <span className="text-foreground">{pendingImages.map((f) => f.name).join(', ')}</span>
          </div>
        )}
        <label className="border-2 border-dashed rounded-xl p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2 cursor-pointer hover:border-primary transition-colors">
          <ImagePlus className="h-6 w-6 opacity-60" />
          {t('panel.company.fleet.form.uploadHelp')}
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
                  toast.error(t('panel.company.fleet.toasts.fileTooLarge', { name: f.name }));
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
          {carId ? t('common.saveChanges') : t('panel.company.fleet.actions.createCar')}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}

export default function DashFleet() {
  const { t } = useTranslation();
  const { currency, locale } = useApp();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<ApiCar | null>(null);
  const [creating, setCreating] = useState(false);
  const cars = useCompanyCars({ search: q || undefined, limit: 100 });
  const deleteCar = useDeleteCar();

  async function onDelete(id: number) {
    if (!window.confirm(t('panel.company.fleet.confirms.deleteCar'))) return;
    try {
      await deleteCar.mutateAsync(id);
      toast.success(t('panel.company.fleet.toasts.carDeleted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.fleet.toasts.couldNotDeleteCar'));
    }
  }

  const myCars = cars.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{t('panel.company.nav.fleet')}</h1>
          <p className="text-muted-foreground mt-1">{t('panel.company.fleet.vehicles', { count: cars.data?.meta.total ?? 0 })}</p>
        </div>
        <Sheet open={creating} onOpenChange={setCreating}>
          <SheetTrigger asChild>
            <Button className="bg-gradient-brand text-white border-0">
              <Plus className="h-4 w-4 mr-1.5" /> {t('panel.company.fleet.actions.addCar')}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-xl overflow-auto">
            <SheetHeader>
              <SheetTitle>{t('panel.company.fleet.titles.addNewCar')}</SheetTitle>
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
            placeholder={t('panel.company.fleet.searchPlaceholder')}
            className="pl-9 border-0 bg-transparent"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">{t('panel.common.car')}</th>
                <th className="px-4 py-3 font-medium">{t('panel.company.fleet.table.plate')}</th>
                <th className="px-4 py-3 font-medium">{t('cars.category')}</th>
                <th className="px-4 py-3 font-medium">{t('panel.common.status')}</th>
                <th className="px-4 py-3 font-medium text-right">{t('panel.company.fleet.table.pricePerDay')}</th>
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
                    <div className="text-muted-foreground mb-3">{t('panel.company.fleet.table.noCars')}</div>
                    <Button className="bg-gradient-brand text-white border-0" onClick={() => setCreating(true)}>
                      <Plus className="h-4 w-4 mr-1.5" /> {t('panel.company.fleet.actions.addFirstCar')}
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
                          {c.year} • {t(`panel.company.fleet.transmission.${c.transmission}`)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">—</td>
                  <td className="px-4 py-3 capitalize">{t(`nav.categories.${c.category}`)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={statusColors[c.status] ?? ''}>
                      {t(`panel.company.fleet.status.${c.status}`)}
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
              <Edit className="h-4 w-4" /> {t('panel.company.fleet.titles.editCar')}
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
