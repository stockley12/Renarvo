import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChevronRight, CreditCard, Calendar, User, ShieldCheck, PartyPopper, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useApp } from '@/store/app';
import { useSession } from '@/store/session';
import { formatPrice } from '@/lib/format';
import { usePublicCar } from '@/lib/hooks/useCars';
import { useCreateReservation } from '@/lib/hooks/useReservations';
import { ApiClientError } from '@/lib/api';

const steps = ['step1', 'step2', 'step3', 'step4'];

const EXTRA_DEFS = [
  { key: 'gps' as const,        type: 'gps',                 label: 'booking.gps',                price: 60 },
  { key: 'child' as const,      type: 'child_seat',          label: 'booking.childSeat',          price: 80 },
  { key: 'addDriver' as const,  type: 'additional_driver',   label: 'booking.additionalDriver',   price: 150 },
  { key: 'fullIns' as const,    type: 'full_insurance',      label: 'booking.fullInsurance',      price: 200 },
];

function isoLocalNow(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function Booking() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { currency, locale } = useApp();
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const sessionLoading = useSession((s) => s.loading);

  const carQ = usePublicCar(id);
  const car = carQ.data;

  const [step, setStep] = useState(0);
  const [extras, setExtras] = useState<Record<string, boolean>>({ gps: false, child: false, addDriver: false, fullIns: true });
  const [pickupAt, setPickupAt] = useState(() => isoLocalNow(1));
  const [returnAt, setReturnAt] = useState(() => isoLocalNow(4));
  const [pickupLocation, setPickupLocation] = useState('');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [dob, setDob] = useState('');
  const [flight, setFlight] = useState('');
  const [confirmCode, setConfirmCode] = useState<string | null>(null);
  const create = useCreateReservation();

  useEffect(() => {
    if (car && !pickupLocation) setPickupLocation(`${car.city} Havalimanı`);
  }, [car, pickupLocation]);
  useEffect(() => {
    if (user) {
      if (!email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
      const parts = user.name?.split(/\s+/) ?? [];
      if (!first && parts[0]) setFirst(parts[0]);
      if (!last && parts.length > 1) setLast(parts.slice(1).join(' '));
    }
  }, [user, email, phone, first, last]);

  // Loading state.
  if (sessionLoading || carQ.isLoading) {
    return (
      <div className="container py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  // Auth gate: anyone landing here without a customer session goes to login.
  if (!user) {
    const next = encodeURIComponent(`/book/${id ?? ''}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (user.role !== 'customer') {
    return (
      <div className="container py-20 text-center max-w-md">
        <h1 className="font-display text-2xl font-bold mb-2">Bookings are for customer accounts</h1>
        <p className="text-sm text-muted-foreground mb-5">
          You're signed in as <span className="font-mono">{user.role}</span>. Please sign out and use a customer account, or
          create a new one.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild variant="outline"><Link to="/">Back home</Link></Button>
          <Button asChild className="bg-gradient-brand text-white border-0"><Link to="/register">Create customer account</Link></Button>
        </div>
      </div>
    );
  }

  if (carQ.isError || !car) {
    return (
      <div className="container py-20 text-center">
        Car not found. <Link to="/cars" className="text-primary">Browse cars</Link>
      </div>
    );
  }

  const pickupDate = new Date(pickupAt);
  const returnDate = new Date(returnAt);
  const days = Math.max(1, Math.ceil((returnDate.getTime() - pickupDate.getTime()) / 86400000));
  const extrasPrice = EXTRA_DEFS.reduce((sum, e) => sum + (extras[e.key] ? e.price : 0), 0);
  const subtotal = car.price_per_day * days + extrasPrice * days;
  const tax = subtotal * 0.18;
  const total = subtotal + tax + 120;

  function validateCustomerStep(): string | null {
    if (!first.trim() || !last.trim()) return 'Enter your first and last name';
    if (!email.trim() || !email.includes('@')) return 'Enter a valid email';
    if (!phone.trim()) return 'Enter a phone number';
    return null;
  }

  async function confirmBooking() {
    if (!car) return;
    try {
      const payload = {
        car_id: car.id,
        pickup_at: new Date(pickupAt).toISOString(),
        return_at: new Date(returnAt).toISOString(),
        pickup_location: pickupLocation,
        flight_number: flight || undefined,
        driving_license_number: licenseNumber || undefined,
        date_of_birth: dob || undefined,
        extras: EXTRA_DEFS.filter((e) => extras[e.key]).map((e) => ({
          type: e.type, price_per_day: e.price, label: t(e.label),
        })),
      };
      const res = await create.mutateAsync(payload);
      setConfirmCode(res.code);
      setStep(3);
      toast.success(t('booking.success'), { description: `Reservation ${res.code} confirmed.` });
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Could not create reservation';
      toast.error(msg);
    }
  }

  function next() {
    if (step === 0) { setStep(1); return; }
    if (step === 1) {
      const err = validateCustomerStep();
      if (err) { toast.error(err); return; }
      setStep(2); return;
    }
    if (step === 2) { void confirmBooking(); return; }
  }

  return (
    <div className="container py-6 sm:py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6 sm:mb-8 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1 min-w-[60px]">
            <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${i <= step ? 'bg-gradient-brand text-white' : 'bg-muted text-muted-foreground'}`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-primary' : 'text-muted-foreground'}`}>{t(`booking.${s}`)}</span>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground/40 hidden sm:block" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4 lg:gap-6">
        <Card className="p-4 sm:p-6 md:p-8">
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> {t('booking.step1')}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>{t('search.pickupDate')}</Label><Input type="datetime-local" value={pickupAt} onChange={(e) => setPickupAt(e.target.value)} /></div>
                <div><Label>{t('search.returnDate')}</Label><Input type="datetime-local" value={returnAt} onChange={(e) => setReturnAt(e.target.value)} /></div>
                <div className="sm:col-span-2"><Label>{t('search.pickup')}</Label><Input value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} /></div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">{t('booking.extras')}</h3>
                <div className="space-y-2">
                  {EXTRA_DEFS.map((e) => (
                    <label key={e.key} className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 active:bg-muted">
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox checked={!!extras[e.key]} onCheckedChange={(v) => setExtras({ ...extras, [e.key]: !!v })} />
                        <span className="text-sm truncate">{t(e.label)}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold shrink-0">+{formatPrice(e.price, currency, locale)}/day</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> {t('booking.step2')}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>First name</Label><Input value={first} onChange={(e) => setFirst(e.target.value)} placeholder="Ahmet" autoComplete="given-name" /></div>
                <div><Label>Last name</Label><Input value={last} onChange={(e) => setLast(e.target.value)} placeholder="Yılmaz" autoComplete="family-name" /></div>
                <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ahmet@example.com" autoComplete="email" /></div>
                <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 555 ..." autoComplete="tel" /></div>
                <div><Label>Driving license #</Label><Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="34 AB 123456" /></div>
                <div><Label>Date of birth</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></div>
                <div className="sm:col-span-2"><Label>Flight number (optional)</Label><Input value={flight} onChange={(e) => setFlight(e.target.value)} placeholder="TK 1234" /></div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> {t('booking.step3')}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm bg-muted/50 p-4 rounded-lg">
                  <ShieldCheck className="h-4 w-4 text-success shrink-0" />
                  <span>
                    Pay-on-pickup. The company collects payment when you pick up the car. Bring a credit card for the deposit.
                  </span>
                </div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="text-center py-10">
              <div className="h-20 w-20 mx-auto rounded-full bg-gradient-brand flex items-center justify-center mb-5 shadow-elevated">
                <PartyPopper className="h-10 w-10 text-white" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold mb-2">{t('booking.success')}</h2>
              <p className="text-muted-foreground mb-6">Reservation code: <span className="font-mono font-bold text-foreground">{confirmCode ?? '—'}</span></p>
              <p className="text-sm text-muted-foreground mb-6">A confirmation will be sent to your email shortly.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button variant="outline" asChild><Link to="/cars">Browse more cars</Link></Button>
                <Button className="bg-gradient-brand text-white border-0" onClick={() => navigate('/')}>Back home</Button>
              </div>
            </div>
          )}

          {step < 3 && (
            <div className="flex items-center justify-between pt-6 mt-6 border-t gap-3">
              <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>{t('booking.back')}</Button>
              <Button onClick={next} disabled={create.isPending} className="bg-gradient-brand text-white border-0">
                {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {step === 2 ? t('booking.confirm') : t('booking.next')}
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-5 h-fit lg:sticky lg:top-20">
          <h3 className="font-display font-bold mb-3">{car.brand} {car.model}</h3>
          <div className="text-xs text-muted-foreground mb-4">{car.year} • {car.city}</div>
          <Separator className="mb-3" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{days} day{days > 1 ? 's' : ''} × {formatPrice(car.price_per_day, currency, locale)}</span><span>{formatPrice(car.price_per_day * days, currency, locale)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Extras</span><span>{formatPrice(extrasPrice * days, currency, locale)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Service fee</span><span>{formatPrice(120, currency, locale)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">KDV (18%)</span><span>{formatPrice(tax, currency, locale)}</span></div>
            <Separator />
            <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatPrice(total, currency, locale)}</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
