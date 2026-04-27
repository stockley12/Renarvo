import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/store/app';
import { formatPrice, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import { useCompanyReservations, useReservationTransition } from '@/lib/hooks/useCompany';
import type { ApiReservation } from '@/lib/api';

const STATUSES = ['pending', 'confirmed', 'active', 'completed', 'cancelled'] as const;
type ReservationStatus = (typeof STATUSES)[number];

const statusBadge: Record<ReservationStatus, string> = {
  pending: 'bg-warning/15 text-warning border-warning/30',
  confirmed: 'bg-primary/15 text-primary border-primary/30',
  active: 'bg-success/15 text-success border-success/30',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/15 text-destructive border-destructive/30',
};

function ReservationDetail({ r, onChanged }: { r: ApiReservation; onChanged: () => void }) {
  const { currency, locale } = useApp();
  const transition = useReservationTransition();
  const [reason, setReason] = useState('');

  async function go(action: 'confirm' | 'reject' | 'pickup' | 'return') {
    try {
      if (action === 'reject' && !reason.trim()) {
        toast.error('Rejection reason required');
        return;
      }
      await transition.mutateAsync({ id: r.id, action, reason: action === 'reject' ? reason : undefined });
      toast.success(`Reservation ${action === 'reject' ? 'rejected' : action === 'return' ? 'completed' : action + 'ed'}`);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update reservation');
    }
  }

  const carLabel = r.car ? `${r.car.brand} ${r.car.model}` : `Car #${r.car_id}`;

  return (
    <div className="space-y-5 mt-6 text-sm">
      <div>
        <h4 className="font-semibold mb-2">Customer</h4>
        <p>
          {r.customer?.name ?? '—'}
          {r.customer?.email && <><br />{r.customer.email}</>}
          {r.customer?.phone && <><br />{r.customer.phone}</>}
        </p>
      </div>
      <Separator />
      <div>
        <h4 className="font-semibold mb-2">Booking</h4>
        <p>
          {carLabel}
          <br />
          {formatDate(r.pickup_at, locale)} → {formatDate(r.return_at, locale)}
          <br />
          {r.pickup_location}
        </p>
        {r.flight_number && <p className="text-xs text-muted-foreground mt-1">Flight: {r.flight_number}</p>}
        {r.notes && <p className="text-xs text-muted-foreground mt-1">Note: {r.notes}</p>}
      </div>
      <Separator />
      <div>
        <h4 className="font-semibold mb-2">Pricing</h4>
        <div className="space-y-1">
          <div className="flex justify-between"><span>Base ({r.days} days)</span><span>{formatPrice(r.price.base, currency, locale)}</span></div>
          {r.price.extras > 0 && <div className="flex justify-between text-muted-foreground"><span>Extras</span><span>{formatPrice(r.price.extras, currency, locale)}</span></div>}
          {r.price.discount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>−{formatPrice(r.price.discount, currency, locale)}</span></div>}
          {r.price.service_fee > 0 && <div className="flex justify-between text-muted-foreground"><span>Service fee</span><span>{formatPrice(r.price.service_fee, currency, locale)}</span></div>}
          {r.price.tax > 0 && <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{formatPrice(r.price.tax, currency, locale)}</span></div>}
          <div className="flex justify-between font-bold pt-2 border-t mt-2">
            <span>Total</span>
            <span>{formatPrice(r.price.total, currency, locale)}</span>
          </div>
        </div>
      </div>
      {r.cancellation_reason && (
        <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-xs">
          <strong>Cancellation reason:</strong> {r.cancellation_reason}
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-3">
        {r.status === 'pending' && (
          <>
            <Button onClick={() => go('confirm')} disabled={transition.isPending} className="bg-success text-success-foreground">
              Confirm
            </Button>
            <Button variant="destructive" onClick={() => go('reject')} disabled={transition.isPending}>
              Reject
            </Button>
          </>
        )}
        {r.status === 'confirmed' && (
          <Button onClick={() => go('pickup')} disabled={transition.isPending}>
            Mark picked up
          </Button>
        )}
        {r.status === 'active' && (
          <Button onClick={() => go('return')} disabled={transition.isPending}>
            Mark returned
          </Button>
        )}
      </div>
      {r.status === 'pending' && (
        <div>
          <Textarea
            placeholder="Reason (required for rejection)"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

export default function DashReservations() {
  const { currency, locale } = useApp();
  const [tab, setTab] = useState<ReservationStatus>('pending');
  const [openId, setOpenId] = useState<number | null>(null);
  const reservations = useCompanyReservations({ status: tab, page: 1 });
  const counts = STATUSES.reduce(
    (acc, s) => {
      acc[s] = 0;
      return acc;
    },
    {} as Record<ReservationStatus, number>,
  );
  if (reservations.data && reservations.data.meta) counts[tab] = reservations.data.meta.total;

  const items = reservations.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Reservations</h1>
        <p className="text-muted-foreground mt-1">Manage all your bookings</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ReservationStatus)}>
        <TabsList className="flex-wrap h-auto">
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Car</th>
                    <th className="px-4 py-3 font-medium">Dates</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.isLoading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                      </td>
                    </tr>
                  )}
                  {!reservations.isLoading && items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        No {tab} reservations
                      </td>
                    </tr>
                  )}
                  {items.map((r) => {
                    const carLabel = r.car ? `${r.car.brand} ${r.car.model}` : `Car #${r.car_id}`;
                    return (
                      <tr key={r.id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{r.code}</td>
                        <td className="px-4 py-3">{r.customer?.name ?? '—'}</td>
                        <td className="px-4 py-3">{carLabel}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatDate(r.pickup_at, locale)} → {formatDate(r.return_at, locale)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={statusBadge[r.status as ReservationStatus]}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatPrice(r.price.total, currency, locale)}
                        </td>
                        <td className="px-4 py-3">
                          <Sheet open={openId === r.id} onOpenChange={(o) => setOpenId(o ? r.id : null)}>
                            <SheetTrigger asChild>
                              <Button size="sm" variant="outline">
                                View
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="overflow-auto">
                              <SheetHeader>
                                <SheetTitle>Reservation {r.code}</SheetTitle>
                              </SheetHeader>
                              <ReservationDetail r={r} onChanged={() => setOpenId(null)} />
                            </SheetContent>
                          </Sheet>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
