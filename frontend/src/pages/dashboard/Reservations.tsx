import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { reservations, cars, type ReservationStatus } from '@/mock/data';
import { useApp } from '@/store/app';
import { formatPrice, formatDate } from '@/lib/format';

const statusBadge: Record<ReservationStatus, string> = {
  pending: 'bg-warning/15 text-warning border-warning/30',
  confirmed: 'bg-primary/15 text-primary border-primary/30',
  active: 'bg-success/15 text-success border-success/30',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/15 text-destructive border-destructive/30',
};

export default function DashReservations() {
  const { currency, locale } = useApp();
  const [tab, setTab] = useState<ReservationStatus>('pending');
  const myRes = reservations.filter(r => r.companyId === 'c1' || r.companyId === 'c2');
  const filtered = myRes.filter(r => r.status === tab);

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Reservations</h1>
        <p className="text-muted-foreground mt-1">Manage all your bookings</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ReservationStatus)}>
        <TabsList>
          {(['pending', 'confirmed', 'active', 'completed', 'cancelled'] as ReservationStatus[]).map(s => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s} <Badge variant="secondary" className="ml-2">{myRes.filter(r => r.status === s).length}</Badge>
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
                  {filtered.map(r => {
                    const car = cars.find(c => c.id === r.carId);
                    return (
                      <tr key={r.id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{r.code}</td>
                        <td className="px-4 py-3">{r.customerName}</td>
                        <td className="px-4 py-3">{car?.brand} {car?.model}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(r.pickupDate, locale)} → {formatDate(r.returnDate, locale)}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className={statusBadge[r.status]}>{r.status}</Badge></td>
                        <td className="px-4 py-3 text-right font-semibold">{formatPrice(r.totalPrice, currency, locale)}</td>
                        <td className="px-4 py-3">
                          <Sheet>
                            <SheetTrigger asChild><Button size="sm" variant="outline">View</Button></SheetTrigger>
                            <SheetContent className="overflow-auto">
                              <SheetHeader><SheetTitle>Reservation {r.code}</SheetTitle></SheetHeader>
                              <div className="space-y-5 mt-6 text-sm">
                                <div>
                                  <h4 className="font-semibold mb-2">Customer</h4>
                                  <p>{r.customerName}<br />{r.customerEmail}<br />{r.customerPhone}</p>
                                </div>
                                <Separator />
                                <div>
                                  <h4 className="font-semibold mb-2">Booking</h4>
                                  <p>{car?.brand} {car?.model}<br />{formatDate(r.pickupDate, locale)} → {formatDate(r.returnDate, locale)}<br />{r.pickupLocation}</p>
                                </div>
                                <Separator />
                                <div>
                                  <h4 className="font-semibold mb-2">Pricing</h4>
                                  <div className="flex justify-between"><span>{r.days} days × {formatPrice(car?.pricePerDay || 0, currency, locale)}</span><span className="font-semibold">{formatPrice(r.totalPrice, currency, locale)}</span></div>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-3">
                                  {r.status === 'pending' && <><Button className="bg-success text-success-foreground">Confirm</Button><Button variant="destructive">Reject</Button></>}
                                  {r.status === 'confirmed' && <Button>Mark picked up</Button>}
                                  {r.status === 'active' && <Button>Mark returned</Button>}
                                  <Button variant="outline">Print contract</Button>
                                  <Button variant="outline">Send message</Button>
                                </div>
                              </div>
                            </SheetContent>
                          </Sheet>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No {tab} reservations</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
