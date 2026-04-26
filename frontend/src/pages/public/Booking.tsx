import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChevronRight, CreditCard, Calendar, User, ShieldCheck, PartyPopper } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cars } from '@/mock/data';
import { useApp } from '@/store/app';
import { formatPrice } from '@/lib/format';

const steps = ['step1', 'step2', 'step3', 'step4'];

export default function Booking() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { currency, locale } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const car = cars.find(c => c.id === id);
  const [step, setStep] = useState(0);
  const [extras, setExtras] = useState({ gps: false, child: false, addDriver: false, fullIns: true });
  const [code] = useState(`RNV-${Math.floor(10000 + Math.random() * 90000)}`);

  if (!car) return <div className="container py-20">Car not found.</div>;

  const days = 3;
  const extrasPrice = (extras.gps ? 60 : 0) + (extras.child ? 80 : 0) + (extras.addDriver ? 150 : 0) + (extras.fullIns ? 200 : 0);
  const subtotal = car.pricePerDay * days + extrasPrice * days;
  const tax = subtotal * 0.18;
  const total = subtotal + tax + 120;

  const next = () => {
    if (step < 3) setStep(step + 1);
    if (step === 2) {
      toast({ title: t('booking.success'), description: `${t('demo.title')}: no real payment processed.` });
    }
  };

  return (
    <div className="container py-8 max-w-5xl">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${i <= step ? 'bg-gradient-brand text-white' : 'bg-muted text-muted-foreground'}`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-primary' : 'text-muted-foreground'}`}>{t(`booking.${s}`)}</span>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground/40" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <Card className="p-6 md:p-8">
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-bold flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> {t('booking.step1')}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>{t('search.pickupDate')}</Label><Input type="datetime-local" defaultValue="2025-06-01T10:00" /></div>
                <div><Label>{t('search.returnDate')}</Label><Input type="datetime-local" defaultValue="2025-06-04T10:00" /></div>
                <div className="sm:col-span-2"><Label>{t('search.pickup')}</Label><Input defaultValue={`${car.city} Havalimanı`} /></div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">{t('booking.extras')}</h3>
                <div className="space-y-2">
                  {[
                    { key: 'gps', label: t('booking.gps'), price: 60 },
                    { key: 'child', label: t('booking.childSeat'), price: 80 },
                    { key: 'addDriver', label: t('booking.additionalDriver'), price: 150 },
                    { key: 'fullIns', label: t('booking.fullInsurance'), price: 200 },
                  ].map(e => (
                    <label key={e.key} className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={(extras as any)[e.key]} onCheckedChange={(v) => setExtras({ ...extras, [e.key]: !!v })} />
                        <span className="text-sm">{e.label}</span>
                      </div>
                      <span className="text-sm font-semibold">+{formatPrice(e.price, currency, locale)}/day</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-bold flex items-center gap-2"><User className="h-5 w-5 text-primary" /> {t('booking.step2')}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>First name</Label><Input placeholder="Ahmet" /></div>
                <div><Label>Last name</Label><Input placeholder="Yılmaz" /></div>
                <div><Label>Email</Label><Input type="email" placeholder="ahmet@example.com" /></div>
                <div><Label>Phone</Label><Input placeholder="+90 555 ..." /></div>
                <div><Label>Driving license #</Label><Input placeholder="34 AB 123456" /></div>
                <div><Label>Date of birth</Label><Input type="date" /></div>
                <div className="sm:col-span-2"><Label>Flight number (optional)</Label><Input placeholder="TK 1234" /></div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-bold flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> {t('booking.step3')}</h2>
              <div className="space-y-4">
                <div><Label>Card number</Label><Input placeholder="4242 4242 4242 4242" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Expiry</Label><Input placeholder="MM/YY" /></div>
                  <div><Label>CVC</Label><Input placeholder="123" /></div>
                </div>
                <div><Label>Cardholder name</Label><Input placeholder="AHMET YILMAZ" /></div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <ShieldCheck className="h-4 w-4 text-success shrink-0" />
                  Demo mode — no real charges. SSL secured form.
                </div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="text-center py-10">
              <div className="h-20 w-20 mx-auto rounded-full bg-gradient-brand flex items-center justify-center mb-5 shadow-elevated">
                <PartyPopper className="h-10 w-10 text-white" />
              </div>
              <h2 className="font-display text-3xl font-extrabold mb-2">{t('booking.success')}</h2>
              <p className="text-muted-foreground mb-6">Reservation code: <span className="font-mono font-bold text-foreground">{code}</span></p>
              <p className="text-sm text-muted-foreground mb-6">A confirmation email has been sent (demo).</p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" asChild><Link to="/cars">Browse more cars</Link></Button>
                <Button className="bg-gradient-brand text-white border-0" asChild><Link to="/">Back home</Link></Button>
              </div>
            </div>
          )}

          {step < 3 && (
            <div className="flex items-center justify-between pt-6 mt-6 border-t">
              <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>{t('booking.back')}</Button>
              <Button onClick={next} className="bg-gradient-brand text-white border-0">
                {step === 2 ? t('booking.confirm') : t('booking.next')}
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-5 h-fit sticky top-20">
          <h3 className="font-display font-bold mb-3">{car.brand} {car.model}</h3>
          <div className="text-xs text-muted-foreground mb-4">{car.year} • {car.city}</div>
          <Separator className="mb-3" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{days} days × {formatPrice(car.pricePerDay, currency, locale)}</span><span>{formatPrice(car.pricePerDay * days, currency, locale)}</span></div>
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
