import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChevronRight, CreditCard, Calendar, User, ShieldCheck, PartyPopper, Loader2, AlertTriangle, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useApp } from '@/store/app';
import { useSession } from '@/store/session';
import { formatPrice } from '@/lib/format';
import { usePublicCar, usePublicCompanyExtras, usePublicCompanyInsurance } from '@/lib/hooks/useCars';
import { useCreateReservation } from '@/lib/hooks/useReservations';
import { useTikoConfig, useTikoCheckout } from '@/lib/hooks/useTiko';
import { ApiClientError } from '@/lib/api';

const steps = ['step1', 'step2', 'step3', 'step4'];

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
  const companyId = car?.company?.id;
  const extrasQ = usePublicCompanyExtras(companyId);
  const insuranceQ = usePublicCompanyInsurance(companyId);

  const [step, setStep] = useState(0);
  const [selectedExtras, setSelectedExtras] = useState<Record<number, boolean>>({});
  const [insurancePackageId, setInsurancePackageId] = useState<number | null>(null);
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
  const [confirmedReservationId, setConfirmedReservationId] = useState<number | null>(null);
  const [tikoIframeUrl, setTikoIframeUrl] = useState<string | null>(null);
  const [tikoOrderId, setTikoOrderId] = useState<string | null>(null);
  const create = useCreateReservation();
  const tikoConfig = useTikoConfig();
  const tikoCheckout = useTikoCheckout();
  const tikoEnabled = tikoConfig.data?.enabled === true;

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

  const extrasCatalog = extrasQ.data ?? [];
  const insurancePackages = insuranceQ.data ?? [];
  const selectedInsurance = useMemo(
    () => insurancePackages.find((p) => p.id === insurancePackageId) ?? null,
    [insurancePackages, insurancePackageId]
  );

  const extrasPrice = useMemo(() => {
    let sum = 0;
    for (const ex of extrasCatalog) {
      if (!selectedExtras[ex.id]) continue;
      if (ex.charge_mode === 'per_day') sum += Number(ex.price_per_day) * days;
      else if (ex.charge_mode === 'per_rental') sum += Number(ex.price_per_rental);
    }
    return sum;
  }, [extrasCatalog, selectedExtras, days]);

  const insurancePrice = selectedInsurance ? Number(selectedInsurance.price_per_day) * days : 0;
  const baseSubtotal = car.price_per_day * days;
  const subtotal = baseSubtotal + extrasPrice + insurancePrice;
  const tax = subtotal * 0.18;
  const serviceFee = 120;
  const total = subtotal + tax + serviceFee;

  const minDays = car.company?.min_rental_days ?? 1;
  const minDaysViolated = days < minDays;

  function validateCustomerStep(): string | null {
    if (!first.trim() || !last.trim()) return 'Enter your first and last name';
    if (!email.trim() || !email.includes('@')) return 'Enter a valid email';
    if (!phone.trim()) return 'Enter a phone number';
    return null;
  }

  async function ensureReservation(): Promise<{ id: number; code: string } | null> {
    if (!car) return null;
    if (confirmedReservationId) {
      return { id: confirmedReservationId, code: confirmCode ?? '' };
    }
    const extraIds = extrasCatalog
      .filter((ex) => selectedExtras[ex.id])
      .map((ex) => ex.id);
    const payload = {
      car_id: car.id,
      pickup_at: new Date(pickupAt).toISOString(),
      return_at: new Date(returnAt).toISOString(),
      pickup_location: pickupLocation,
      flight_number: flight || undefined,
      driving_license_number: licenseNumber || undefined,
      date_of_birth: dob || undefined,
      insurance_package_id: insurancePackageId,
      extra_ids: extraIds.length > 0 ? extraIds : undefined,
    };
    const res = await create.mutateAsync(payload);
    setConfirmCode(res.code);
    setConfirmedReservationId(res.id);
    return { id: res.id, code: res.code };
  }

  async function confirmAndPay() {
    if (!car) return;
    if (minDaysViolated) {
      toast.error(t('booking.minDaysWarning', { days: minDays }));
      return;
    }
    try {
      const reservation = await ensureReservation();
      if (!reservation) return;

      if (!tikoEnabled) {
        // Pay-on-pickup fallback (existing flow)
        setStep(3);
        toast.success(t('booking.success'), { description: `Reservation ${reservation.code} confirmed.` });
        return;
      }

      // TIKO 3DS iframe checkout
      const result = await tikoCheckout.mutateAsync({ reservationId: reservation.id });
      setTikoOrderId(result.order_id);
      setTikoIframeUrl(result.iframe_url);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : err instanceof Error ? err.message : 'Could not create reservation';
      toast.error(msg);
    }
  }

  function next() {
    if (step === 0) {
      if (minDaysViolated) {
        toast.error(t('booking.minDaysWarning', { days: minDays }));
        return;
      }
      setStep(1); return;
    }
    if (step === 1) {
      const err = validateCustomerStep();
      if (err) { toast.error(err); return; }
      setStep(2); return;
    }
    if (step === 2) { void confirmAndPay(); return; }
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

              {minDaysViolated && (
                <div className="flex items-start gap-3 p-3 rounded-lg border border-warning/40 bg-warning/10 text-sm">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <span>{t('booking.minDaysWarning', { days: minDays })}</span>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> {t('booking.insurancePackage')}
                </h3>
                {insuranceQ.isLoading ? (
                  <div className="text-sm text-muted-foreground">…</div>
                ) : insurancePackages.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 rounded-lg border border-dashed">
                    {t('booking.noInsurance')}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setInsurancePackageId(null)}
                      className={`text-left p-3 rounded-lg border-2 transition-colors ${
                        insurancePackageId === null ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="text-sm font-semibold">{t('booking.insuranceNone')}</div>
                      <div className="text-xs text-muted-foreground mt-1">—</div>
                    </button>
                    {insurancePackages.map((p) => {
                      const tierLabel = p.tier === 'mini' ? t('booking.insuranceMini') : p.tier === 'mid' ? t('booking.insuranceMid') : t('booking.insuranceFull');
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => setInsurancePackageId(p.id)}
                          className={`text-left p-3 rounded-lg border-2 transition-colors ${
                            insurancePackageId === p.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                          }`}
                        >
                          <div className="text-sm font-semibold capitalize">{p.name || tierLabel}</div>
                          <div className="text-xs text-muted-foreground mt-1">{tierLabel}</div>
                          <div className="text-sm font-bold text-primary mt-2">
                            +{formatPrice(Number(p.price_per_day), currency, locale)}/day
                          </div>
                          {p.description && <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{p.description}</div>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-3">{t('booking.extras')}</h3>
                {extrasQ.isLoading ? (
                  <div className="text-sm text-muted-foreground">…</div>
                ) : extrasCatalog.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 rounded-lg border border-dashed">
                    {t('booking.noExtras')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {extrasCatalog.map((ex) => {
                      const priceLabel =
                        ex.charge_mode === 'free'
                          ? t('common.free')
                          : ex.charge_mode === 'per_rental'
                          ? `+${formatPrice(Number(ex.price_per_rental), currency, locale)}`
                          : `+${formatPrice(Number(ex.price_per_day), currency, locale)}/day`;
                      return (
                        <label key={ex.id} className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 active:bg-muted">
                          <div className="flex items-center gap-3 min-w-0">
                            <Checkbox
                              checked={!!selectedExtras[ex.id]}
                              onCheckedChange={(v) => setSelectedExtras({ ...selectedExtras, [ex.id]: !!v })}
                            />
                            <div className="min-w-0">
                              <div className="text-sm truncate">{ex.name}</div>
                              {ex.description && <div className="text-[11px] text-muted-foreground truncate">{ex.description}</div>}
                            </div>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold shrink-0">{priceLabel}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
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
                {tikoEnabled ? (
                  <div className="flex items-center gap-2 text-sm bg-primary/5 border border-primary/30 p-4 rounded-lg">
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                    <span>
                      {t('booking.payWithCard')} — TIKO 3D Secure ({tikoConfig.data?.mode === 'sandbox' ? 'sandbox' : 'live'}).
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm bg-muted/50 p-4 rounded-lg">
                    <ShieldCheck className="h-4 w-4 text-success shrink-0" />
                    <span>{t('booking.paymentDisabled')}</span>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  {t('carDetail.total')}: <span className="font-bold text-foreground">{formatPrice(total, currency, locale)}</span>
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
              {step === 2 ? (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          onClick={next}
                          disabled={create.isPending || tikoCheckout.isPending}
                          className="bg-gradient-brand text-white border-0"
                        >
                          {(create.isPending || tikoCheckout.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          {tikoEnabled ? t('booking.continueToPayment') : t('booking.confirm')}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!tikoEnabled && (
                      <TooltipContent>
                        <span className="text-xs">{t('booking.paymentDisabled')}</span>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button onClick={next} disabled={create.isPending} className="bg-gradient-brand text-white border-0">
                  {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t('booking.next')}
                </Button>
              )}
            </div>
          )}
        </Card>

        <Card className="p-5 h-fit lg:sticky lg:top-20">
          <h3 className="font-display font-bold mb-3">{car.brand} {car.model}</h3>
          <div className="text-xs text-muted-foreground mb-4">{car.year} • {car.city}</div>
          <Separator className="mb-3" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{days} day{days > 1 ? 's' : ''} × {formatPrice(car.price_per_day, currency, locale)}</span><span>{formatPrice(baseSubtotal, currency, locale)}</span></div>
            {extrasPrice > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">{t('booking.extras')}</span><span>{formatPrice(extrasPrice, currency, locale)}</span></div>
            )}
            {insurancePrice > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">{t('booking.insurancePackage')}</span><span>{formatPrice(insurancePrice, currency, locale)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">{t('carDetail.serviceFee')}</span><span>{formatPrice(serviceFee, currency, locale)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t('carDetail.taxKdv')}</span><span>{formatPrice(tax, currency, locale)}</span></div>
            <Separator />
            <div className="flex justify-between font-bold text-base"><span>{t('carDetail.total')}</span><span>{formatPrice(total, currency, locale)}</span></div>
            {Number(car.deposit) > 0 && (
              <div className="text-xs text-muted-foreground pt-2">
                {t('carDetail.deposit', { amount: Number(car.deposit).toLocaleString() })}
              </div>
            )}
          </div>
        </Card>
      </div>

      <Dialog
        open={tikoIframeUrl !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTikoIframeUrl(null);
            if (confirmedReservationId) {
              navigate(`/payment/result?reservation=${confirmedReservationId}${tikoOrderId ? `&order=${encodeURIComponent(tikoOrderId)}` : ''}`);
            }
          }
        }}
      >
        <DialogContent className="max-w-3xl w-[95vw] sm:w-full p-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="text-base">{t('booking.payWithCard')}</DialogTitle>
            <DialogDescription className="text-xs">
              {t('carDetail.total')}: <span className="font-semibold">{formatPrice(total, currency, locale)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/30">
            {tikoIframeUrl && (
              <iframe
                src={tikoIframeUrl}
                title="TIKO 3D Secure"
                className="w-full h-[70vh] border-0 bg-white"
                allow="payment *"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
