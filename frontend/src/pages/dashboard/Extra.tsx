import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, Tag, Percent, Send,
  Plug, Check, MessageSquare, Sparkles,
} from 'lucide-react';
import { cars } from '@/mock/data';

/* ============== CALENDAR ============== */
export function DashCalendar() {
  const today = new Date();
  const month = today.toLocaleString('en', { month: 'long', year: 'numeric' });
  const days = Array.from({ length: 35 }, (_, i) => i - 2);
  const myCars = cars.filter(c => c.companyId === 'c1').slice(0, 6);

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Calendar</h1>
          <p className="text-muted-foreground mt-1">Visual fleet availability and bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="font-semibold text-sm w-32 text-center">{month}</span>
          <Button variant="outline" size="sm"><ChevronRight className="h-4 w-4" /></Button>
          <Button className="bg-gradient-brand text-white border-0" size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> Block dates
          </Button>
        </div>
      </div>

      {/* Month grid */}
      <Card className="p-5">
        <div className="grid grid-cols-7 gap-1.5 mb-2 text-[11px] font-semibold uppercase text-muted-foreground">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const inMonth = d > 0 && d <= 30;
            const bookings = inMonth ? Math.floor(Math.random() * 6) : 0;
            const isToday = d === today.getDate();
            return (
              <div
                key={d}
                className={`aspect-square rounded-lg border p-2 text-xs ${
                  inMonth ? 'bg-background hover:border-primary cursor-pointer' : 'bg-muted/20 text-muted-foreground/40'
                } ${isToday ? 'border-primary border-2' : 'border-border/60'}`}
              >
                <div className="font-semibold">{inMonth ? d : ''}</div>
                {bookings > 0 && (
                  <div className="mt-1 space-y-0.5">
                    <div className="h-1 rounded-full bg-primary/60" />
                    {bookings > 2 && <div className="h-1 rounded-full bg-success/60" />}
                    {bookings > 4 && <div className="h-1 rounded-full bg-warning/60" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Per-car timeline */}
      <Card className="p-5">
        <h3 className="font-display font-bold text-lg mb-4">Fleet timeline · next 14 days</h3>
        <div className="space-y-2">
          {myCars.map((c, i) => (
            <div key={c.id} className="grid grid-cols-[180px_1fr] items-center gap-3">
              <div className="text-sm font-medium truncate">{c.brand} {c.model}</div>
              <div className="grid gap-0.5 h-7 rounded-md overflow-hidden bg-muted/30" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
                {Array.from({ length: 14 }).map((_, d) => {
                  const r = (i + d) % 5;
                  const cls = r === 0 ? 'bg-primary/70' : r === 1 ? 'bg-success/70' : r === 4 ? 'bg-warning/70' : 'bg-transparent';
                  return <div key={d} className={cls} title={`Day ${d + 1}`} />;
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-primary/70" /> Confirmed</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-success/70" /> Active rental</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-warning/70" /> Maintenance</span>
        </div>
      </Card>
    </div>
  );
}

/* ============== PRICING & PROMOS ============== */
export function DashPricing() {
  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Pricing & promotions</h1>
        <p className="text-muted-foreground mt-1">Seasonal rates, weekly discounts and promo codes</p>
      </div>

      <Tabs defaultValue="seasonal">
        <TabsList>
          <TabsTrigger value="seasonal">Seasonal pricing</TabsTrigger>
          <TabsTrigger value="discounts">Length discounts</TabsTrigger>
          <TabsTrigger value="promos">Promo codes</TabsTrigger>
        </TabsList>

        <TabsContent value="seasonal" className="mt-4 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold">Seasonal rate adjustments</h3>
              <Button size="sm" className="bg-gradient-brand text-white border-0"><Plus className="h-4 w-4 mr-1.5" /> Add season</Button>
            </div>
            <div className="space-y-3">
              {[
                { name: 'High season (Jun – Sep)', adj: '+25%', dates: '01 Jun → 30 Sep', active: true },
                { name: 'Christmas & NYE', adj: '+40%', dates: '20 Dec → 05 Jan', active: true },
                { name: 'Low season', adj: '-10%', dates: '15 Jan → 31 Mar', active: false },
              ].map(s => (
                <div key={s.name} className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                  <div>
                    <div className="font-semibold text-sm">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.dates}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={s.adj.startsWith('+') ? 'border-success/40 text-success' : 'border-warning/40 text-warning'}>
                      {s.adj}
                    </Badge>
                    <Switch defaultChecked={s.active} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="discounts" className="mt-4">
          <Card className="p-5">
            <h3 className="font-display font-bold mb-4">Weekly & monthly discounts</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Weekly discount (7+ days)</Label>
                <div className="relative"><Input type="number" defaultValue="10" /><Percent className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" /></div>
              </div>
              <div>
                <Label>Monthly discount (28+ days)</Label>
                <div className="relative"><Input type="number" defaultValue="25" /><Percent className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" /></div>
              </div>
              <div>
                <Label>Last-minute discount (within 3 days)</Label>
                <div className="relative"><Input type="number" defaultValue="15" /><Percent className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" /></div>
              </div>
              <div>
                <Label>Early-bird discount (60+ days ahead)</Label>
                <div className="relative"><Input type="number" defaultValue="8" /><Percent className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" /></div>
              </div>
            </div>
            <Button className="mt-5 bg-gradient-brand text-white border-0">Save changes</Button>
          </Card>
        </TabsContent>

        <TabsContent value="promos" className="mt-4">
          <Card className="overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-display font-bold">Promo codes</h3>
              <Button size="sm" className="bg-gradient-brand text-white border-0"><Plus className="h-4 w-4 mr-1.5" /> New code</Button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Discount</th><th className="px-4 py-3">Used</th><th className="px-4 py-3">Expires</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody>
                {[
                  { code: 'WELCOME10', off: '10%', used: '47/100', exp: '2025-12-31', status: 'active' },
                  { code: 'SUMMER25', off: '25%', used: '128/200', exp: '2025-09-30', status: 'active' },
                  { code: 'KARPAZ4X4', off: '€20', used: '12/50', exp: '2025-11-15', status: 'active' },
                  { code: 'EARLYBIRD', off: '15%', used: '210/210', exp: '2025-04-01', status: 'used up' },
                ].map(p => (
                  <tr key={p.code} className="border-t">
                    <td className="px-4 py-3 font-mono font-semibold">{p.code}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{p.off}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{p.used}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.exp}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === 'active' ? 'secondary' : 'outline'}>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============== MESSAGES (inbox) ============== */
export function DashMessages() {
  const threads = [
    { id: 1, name: 'Sophie Bennett', last: 'Hi, can I pick up at 8 AM?', time: '2m', unread: true, ini: 'SB' },
    { id: 2, name: 'Иван Петров', last: 'Спасибо большое!', time: '1h', unread: true, ini: 'ИП' },
    { id: 3, name: 'Mehmet Özkan', last: 'Anahtarları teslim aldım, teşekkürler.', time: '3h', unread: false, ini: 'MÖ' },
    { id: 4, name: 'Hans Müller', last: 'Booking confirmed, danke!', time: '1d', unread: false, ini: 'HM' },
    { id: 5, name: 'James Whitcombe', last: 'Is the GPS English-language?', time: '2d', unread: false, ini: 'JW' },
  ];
  const [active, setActive] = useState(1);
  const current = threads.find(t => t.id === active)!;

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Messages</h1>
        <p className="text-muted-foreground mt-1">Customer chat and pre-booking inquiries</p>
      </div>

      <Card className="grid grid-cols-1 md:grid-cols-[300px_1fr] h-[600px] overflow-hidden">
        {/* Thread list */}
        <div className="border-r flex flex-col">
          <div className="p-3 border-b">
            <Input placeholder="Search messages…" className="h-9 bg-muted/40 border-0" />
          </div>
          <ScrollArea className="flex-1">
            {threads.map(t => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`w-full flex items-start gap-3 p-3 border-b text-left hover:bg-muted/40 transition-colors ${
                  active === t.id ? 'bg-primary/5' : ''
                }`}
              >
                <Avatar className="h-9 w-9"><AvatarFallback className="bg-gradient-brand text-white text-xs">{t.ini}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm truncate">{t.name}</span>
                    <span className="text-[10px] text-muted-foreground">{t.time}</span>
                  </div>
                  <div className={`text-xs truncate ${t.unread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {t.last}
                  </div>
                </div>
                {t.unread && <span className="h-2 w-2 rounded-full bg-primary mt-1.5" />}
              </button>
            ))}
          </ScrollArea>
        </div>

        {/* Conversation */}
        <div className="flex flex-col">
          <div className="p-4 border-b flex items-center gap-3">
            <Avatar className="h-9 w-9"><AvatarFallback className="bg-gradient-brand text-white text-xs">{current.ini}</AvatarFallback></Avatar>
            <div className="flex-1">
              <div className="font-semibold text-sm">{current.name}</div>
              <div className="text-xs text-muted-foreground">Booking RNV-10042 · Toyota Corolla</div>
            </div>
            <Button size="sm" variant="outline">View booking</Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3 max-w-xl mx-auto">
              <div className="flex justify-start"><div className="rounded-2xl bg-muted px-4 py-2 text-sm">Hi! Picking up tomorrow at Ercan.</div></div>
              <div className="flex justify-end"><div className="rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-sm">Welcome! What time does your flight land?</div></div>
              <div className="flex justify-start"><div className="rounded-2xl bg-muted px-4 py-2 text-sm">{current.last}</div></div>
            </div>
          </ScrollArea>
          <div className="p-3 border-t flex gap-2">
            <Input placeholder="Type a message…" className="flex-1" />
            <Button className="bg-gradient-brand text-white border-0"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ============== INTEGRATIONS ============== */
export function DashIntegrations() {
  const items = [
    { name: 'Stripe', desc: 'Accept card payments worldwide', connected: true, color: 'bg-[#635bff]/10 text-[#635bff]' },
    { name: 'WhatsApp Business', desc: 'Send booking confirmations on WhatsApp', connected: true, color: 'bg-success/10 text-success' },
    { name: 'Google Calendar', desc: 'Sync reservations to your calendar', connected: false, color: 'bg-primary/10 text-primary' },
    { name: 'Zapier', desc: '5000+ apps via Zapier', connected: false, color: 'bg-warning/10 text-warning' },
    { name: 'Mailchimp', desc: 'Email marketing for past customers', connected: false, color: 'bg-warning/10 text-warning' },
    { name: 'Webhook', desc: 'Real-time event push to your system', connected: false, color: 'bg-muted text-foreground' },
  ];
  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Integrations</h1>
        <p className="text-muted-foreground mt-1">Connect Renarvo with your tools</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map(i => (
          <Card key={i.name} className="p-5">
            <div className="flex items-start gap-3">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${i.color}`}>
                <Plug className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold">{i.name}</h3>
                  {i.connected && <Badge variant="outline" className="border-success/40 text-success gap-1"><Check className="h-3 w-3" /> Connected</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{i.desc}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {i.connected ? (
                <>
                  <Button size="sm" variant="outline">Configure</Button>
                  <Button size="sm" variant="ghost" className="text-destructive">Disconnect</Button>
                </>
              ) : (
                <Button size="sm" className="bg-gradient-brand text-white border-0">Connect</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
