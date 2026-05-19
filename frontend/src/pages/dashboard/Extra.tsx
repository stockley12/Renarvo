import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronLeft, ChevronRight, Plus, Percent, Send, Plug, Check, Loader2, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/store/app';
import { formatDate } from '@/lib/format';
import {
  useCompanyCalendar,
  useCompanyPricing,
  useUpdatePricing,
  useCompanyPromos,
  useCreatePromo,
  useUpdatePromo,
  useDeletePromo,
  useCompanyMessages,
  useCompanyMessageThread,
  useReplyMessage,
} from '@/lib/hooks/useCompany';

/* ============== CALENDAR ============== */
export function DashCalendar() {
  const { t } = useTranslation();
  const { locale } = useApp();
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);

  const monthStart = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    return d;
  }, [monthOffset, today]);
  const monthEnd = useMemo(() => new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0), [monthStart]);
  const fromIso = monthStart.toISOString().slice(0, 10);
  const toIso = monthEnd.toISOString().slice(0, 10);

  const events = useCompanyCalendar(fromIso, toIso);
  const monthLabel = monthStart.toLocaleString(locale, { month: 'long', year: 'numeric' });

  const eventsByDay: Record<number, Array<{ id: number; code: string; status: string; car: string | null }>> = {};
  (events.data ?? []).forEach((e) => {
    const day = new Date(e.start).getDate();
    if (new Date(e.start).getMonth() === monthStart.getMonth()) {
      eventsByDay[day] = [...(eventsByDay[day] ?? []), { id: e.id, code: e.code, status: e.status, car: e.car }];
    }
  });

  const days = Array.from({ length: 35 }, (_, i) => {
    const startDay = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;
    return i - startDay + 1;
  });

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">{t('panel.company.nav.calendar')}</h1>
          <p className="text-muted-foreground mt-1">{t('panel.company.extra.calendar.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setMonthOffset((m) => m - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm w-32 text-center">{monthLabel}</span>
          <Button variant="outline" size="sm" onClick={() => setMonthOffset((m) => m + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="p-5">
        {events.isLoading && (
          <div className="py-12 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 mx-auto animate-spin" />
          </div>
        )}
        {!events.isLoading && (
          <>
            <div className="grid grid-cols-7 gap-1.5 mb-2 text-[11px] font-semibold uppercase text-muted-foreground">
              {[
                t('panel.company.extra.calendar.weekdays.mon'),
                t('panel.company.extra.calendar.weekdays.tue'),
                t('panel.company.extra.calendar.weekdays.wed'),
                t('panel.company.extra.calendar.weekdays.thu'),
                t('panel.company.extra.calendar.weekdays.fri'),
                t('panel.company.extra.calendar.weekdays.sat'),
                t('panel.company.extra.calendar.weekdays.sun'),
              ].map((d) => (
                <div key={d} className="text-center">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((d, idx) => {
                const inMonth = d > 0 && d <= monthEnd.getDate();
                const isToday = inMonth && d === today.getDate() && monthStart.getMonth() === today.getMonth();
                const dayEvents = inMonth ? eventsByDay[d] ?? [] : [];
                return (
                  <div
                    key={idx}
                    className={`min-h-[80px] rounded-lg border p-2 text-xs ${
                      inMonth ? 'bg-background' : 'bg-muted/20 text-muted-foreground/40'
                    } ${isToday ? 'border-primary border-2' : 'border-border/60'}`}
                  >
                    <div className="font-semibold">{inMonth ? d : ''}</div>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <div
                          key={e.id}
                          className={`text-[10px] truncate rounded px-1 ${
                            e.status === 'active'
                              ? 'bg-success/20 text-success'
                              : e.status === 'confirmed'
                              ? 'bg-primary/20 text-primary'
                              : e.status === 'pending'
                              ? 'bg-warning/20 text-warning'
                              : 'bg-muted'
                          }`}
                          title={`${e.code} · ${e.car ?? ''}`}
                        >
                          {e.code}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 3}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-warning/70" /> {t('panel.company.reservations.status.pending')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-primary/70" /> {t('panel.company.reservations.status.confirmed')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-success/70" /> {t('panel.company.extra.calendar.activeRental')}
              </span>
            </div>
          </>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="font-display font-bold text-lg mb-4">{t('panel.company.extra.calendar.allBookingsThisMonth')}</h3>
        {(events.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('panel.company.extra.calendar.noBookingsInMonth')}</p>
        ) : (
          <div className="space-y-2">
            {(events.data ?? []).map((e) => (
              <div key={e.id} className="grid grid-cols-[80px_1fr_1fr_120px] items-center gap-3 text-sm py-2 border-b last:border-0">
                <span className="font-mono text-xs">{e.code}</span>
                <span className="truncate">{e.car ?? '—'}</span>
                <span className="text-muted-foreground text-xs">
                  {formatDate(e.start, locale)} → {formatDate(e.end, locale)}
                </span>
                <Badge variant="outline" className="capitalize">
                  {e.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ============== PRICING & PROMOS ============== */
export function DashPricing() {
  const { t } = useTranslation();
  const pricing = useCompanyPricing();
  const updatePricing = useUpdatePricing();
  const promos = useCompanyPromos();
  const createPromo = useCreatePromo();
  const updatePromo = useUpdatePromo();
  const deletePromo = useDeletePromo();

  // Promo form
  const [promoCode, setPromoCode] = useState('');
  const [promoType, setPromoType] = useState<'percent' | 'fixed'>('percent');
  const [promoValue, setPromoValue] = useState(10);
  const [promoMaxUses, setPromoMaxUses] = useState<number | ''>('');
  const [promoExpires, setPromoExpires] = useState('');

  async function onCreatePromo(e: React.FormEvent) {
    e.preventDefault();
    if (!promoCode.trim()) {
      toast.error(t('panel.company.extra.pricing.toasts.promoCodeRequired'));
      return;
    }
    try {
      await createPromo.mutateAsync({
        code: promoCode,
        discount_type: promoType,
        discount_value: promoValue,
        max_uses: promoMaxUses === '' ? null : Number(promoMaxUses),
        expires_at: promoExpires || null,
        active: true,
      });
      toast.success(t('panel.company.extra.pricing.toasts.promoCodeCreated'));
      setPromoCode('');
      setPromoValue(10);
      setPromoMaxUses('');
      setPromoExpires('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.extra.pricing.toasts.couldNotCreatePromo'));
    }
  }

  async function togglePromo(id: number, active: boolean) {
    try {
      await updatePromo.mutateAsync({ id, input: { active } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.extra.pricing.toasts.couldNotUpdatePromo'));
    }
  }

  async function onDeletePromo(id: number) {
    if (!window.confirm(t('panel.company.extra.pricing.confirms.deletePromoCode'))) return;
    try {
      await deletePromo.mutateAsync(id);
      toast.success(t('panel.company.extra.pricing.toasts.promoDeleted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.extra.pricing.toasts.couldNotDeletePromo'));
    }
  }

  // Length discounts simple form
  const seasonal = pricing.data?.seasonal ?? [];
  const lengthDiscounts = pricing.data?.length_discounts ?? [];
  const [weekly, setWeekly] = useState(0);
  const [monthly, setMonthly] = useState(0);
  const [primed, setPrimed] = useState(false);

  if (!primed && pricing.data) {
    const w = lengthDiscounts.find((d) => d.min_days === 7);
    const m = lengthDiscounts.find((d) => d.min_days === 28);
    setWeekly(w?.discount_pct ?? 0);
    setMonthly(m?.discount_pct ?? 0);
    setPrimed(true);
  }

  async function onSaveDiscounts() {
    try {
      const next: Array<{ min_days: number; discount_pct: number }> = [];
      if (weekly > 0) next.push({ min_days: 7, discount_pct: weekly });
      if (monthly > 0) next.push({ min_days: 28, discount_pct: monthly });
      await updatePricing.mutateAsync({
        seasonal: seasonal.map(({ id: _id, ...rest }) => rest as never),
        length_discounts: next as never,
      });
      toast.success(t('panel.company.extra.pricing.toasts.lengthDiscountsSaved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.extra.pricing.toasts.couldNotSaveDiscounts'));
    }
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="font-display text-3xl font-extrabold">{t('panel.company.nav.pricingPromos')}</h1>
        <p className="text-muted-foreground mt-1">{t('panel.company.extra.pricing.subtitle')}</p>
      </div>

      <Tabs defaultValue="discounts">
        <TabsList>
          <TabsTrigger value="discounts">{t('panel.company.extra.pricing.tabs.lengthDiscounts')}</TabsTrigger>
          <TabsTrigger value="promos">{t('panel.company.extra.pricing.tabs.promoCodes')}</TabsTrigger>
        </TabsList>

        <TabsContent value="discounts" className="mt-4">
          <Card className="p-5">
            <h3 className="font-display font-bold mb-4">{t('panel.company.extra.pricing.weeklyMonthlyDiscounts')}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>{t('panel.company.extra.pricing.weeklyDiscount')}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={weekly}
                    min={0}
                    max={90}
                    onChange={(e) => setWeekly(parseInt(e.target.value) || 0)}
                  />
                  <Percent className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" />
                </div>
              </div>
              <div>
                <Label>{t('panel.company.extra.pricing.monthlyDiscount')}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={monthly}
                    min={0}
                    max={90}
                    onChange={(e) => setMonthly(parseInt(e.target.value) || 0)}
                  />
                  <Percent className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" />
                </div>
              </div>
            </div>
            <Button onClick={onSaveDiscounts} disabled={updatePricing.isPending} className="mt-5 bg-gradient-brand text-white border-0">
              {updatePricing.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {t('common.saveChanges')}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="promos" className="mt-4 space-y-4">
          <Card className="p-5">
            <h3 className="font-display font-bold mb-4">{t('panel.company.extra.pricing.createPromoCode')}</h3>
            <form onSubmit={onCreatePromo} className="grid sm:grid-cols-5 gap-3 items-end">
              <div>
                <Label>{t('panel.common.code')}</Label>
                <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="WELCOME10" />
              </div>
              <div>
                <Label>{t('panel.company.extra.pricing.type')}</Label>
                <select
                  value={promoType}
                  onChange={(e) => setPromoType(e.target.value as 'percent' | 'fixed')}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                >
                  <option value="percent">{t('panel.company.extra.pricing.discountType.percent')}</option>
                  <option value="fixed">{t('panel.company.extra.pricing.discountType.fixed')}</option>
                </select>
              </div>
              <div>
                <Label>{t('panel.company.extra.pricing.value')}</Label>
                <Input type="number" value={promoValue} onChange={(e) => setPromoValue(parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <Label>{t('panel.company.extra.pricing.maxUses')}</Label>
                <Input
                  type="number"
                  value={promoMaxUses}
                  onChange={(e) => setPromoMaxUses(e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder="∞"
                />
              </div>
              <div>
                <Label>{t('panel.company.extra.pricing.expires')}</Label>
                <Input type="date" value={promoExpires} onChange={(e) => setPromoExpires(e.target.value)} />
              </div>
              <div className="sm:col-span-5">
                <Button type="submit" disabled={createPromo.isPending} className="bg-gradient-brand text-white border-0">
                  <Plus className="h-4 w-4 mr-1.5" /> {t('panel.company.extra.pricing.actions.createCode')}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-5 border-b font-display font-bold">{t('panel.company.extra.pricing.existingCodes')}</div>
            {promos.isLoading ? (
              <div className="py-12 text-center text-muted-foreground">
                <Loader2 className="h-5 w-5 mx-auto animate-spin" />
              </div>
            ) : (promos.data ?? []).length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">{t('panel.company.extra.pricing.noPromoCodes')}</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{t('panel.common.code')}</th>
                    <th className="px-4 py-3">{t('panel.company.extra.pricing.table.discount')}</th>
                    <th className="px-4 py-3">{t('panel.company.extra.pricing.table.used')}</th>
                    <th className="px-4 py-3">{t('panel.company.extra.pricing.expires')}</th>
                    <th className="px-4 py-3">{t('panel.company.extra.pricing.table.active')}</th>
                    <th className="px-4 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {(promos.data ?? []).map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-4 py-3 font-mono font-semibold">{p.code}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {p.discount_type === 'percent' ? `${p.discount_value}%` : `₺${p.discount_value}`}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.used_count}
                        {p.max_uses ? `/${p.max_uses}` : ''}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{p.expires_at?.slice(0, 10) ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Switch checked={p.active} onCheckedChange={(v) => togglePromo(p.id, v)} />
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon" onClick={() => onDeletePromo(p.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============== MESSAGES ============== */
export function DashMessages() {
  const { t } = useTranslation();
  const threads = useCompanyMessages();
  const [active, setActive] = useState<number | null>(null);
  const thread = useCompanyMessageThread(active);
  const reply = useReplyMessage();
  const [body, setBody] = useState('');

  const items = threads.data?.data ?? [];
  if (active === null && items.length > 0) setActive(items[0].id);

  async function onSend() {
    if (!active || !body.trim()) return;
    try {
      await reply.mutateAsync({ threadId: active, body });
      setBody('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.extra.messages.toasts.couldNotSendMessage'));
    }
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="font-display text-3xl font-extrabold">{t('panel.company.nav.messages')}</h1>
        <p className="text-muted-foreground mt-1">{t('panel.company.extra.messages.subtitle')}</p>
      </div>

      {threads.isLoading ? (
        <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
          <Loader2 className="h-6 w-6 mr-2 animate-spin" /> {t('panel.company.extra.messages.loadingMessages')}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          {t('panel.company.extra.messages.noConversations')}
        </Card>
      ) : (
        <Card className="grid grid-cols-1 md:grid-cols-[300px_1fr] h-[600px] overflow-hidden">
          <div className="border-r flex flex-col">
            <ScrollArea className="flex-1">
              {items.map((threadItem) => (
                <button
                  key={threadItem.id}
                  onClick={() => setActive(threadItem.id)}
                  className={`w-full flex items-start gap-3 p-3 border-b text-left hover:bg-muted/40 transition-colors ${
                    active === threadItem.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-gradient-brand text-white text-xs">
                      {(threadItem.customer?.name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm truncate">{threadItem.customer?.name ?? t('panel.company.extra.messages.customer')}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{threadItem.subject ?? t('panel.company.extra.messages.conversation')}</div>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </div>

          <div className="flex flex-col">
            {!thread.data ? (
              <div className="flex items-center justify-center flex-1 text-muted-foreground">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> {t('common.loading')}
              </div>
            ) : (
              <>
                <div className="p-4 border-b flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-gradient-brand text-white text-xs">
                      {(thread.data.customer?.name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{thread.data.customer?.name ?? t('panel.company.extra.messages.customer')}</div>
                    <div className="text-xs text-muted-foreground">{thread.data.customer?.email}</div>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3 max-w-xl mx-auto">
                    {(thread.data.messages ?? []).map((m) => {
                      const isMine = m.sender?.role === 'company_owner' || m.sender?.role === 'company_staff';
                      return (
                        <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`rounded-2xl px-4 py-2 text-sm max-w-[80%] whitespace-pre-line ${
                              isMine ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}
                          >
                            {m.body}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <div className="p-3 border-t flex gap-2">
                  <Input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onSend();
                      }
                    }}
                    placeholder={t('panel.company.extra.messages.typeMessage')}
                    className="flex-1"
                  />
                  <Button onClick={onSend} disabled={reply.isPending} className="bg-gradient-brand text-white border-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ============== INTEGRATIONS ============== */
export function DashIntegrations() {
  const { t } = useTranslation();
  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-extrabold">{t('panel.company.nav.integrations')}</h1>
        <p className="text-muted-foreground mt-1">{t('panel.company.extra.integrations.subtitle')}</p>
      </div>
      <Card className="p-10 text-center text-muted-foreground">
        <Plug className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">
          {t('panel.company.extra.integrations.comingSoon')}
        </p>
      </Card>
    </div>
  );
}
