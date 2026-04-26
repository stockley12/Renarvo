import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  Activity, AlertTriangle, ShieldAlert, Bell, Server, Database,
  Globe, Cpu, CheckCircle2, Clock, FileSearch, Send, Mail,
} from 'lucide-react';

/* ============== AUDIT LOG ============== */
export function AdminAuditLog() {
  const events = [
    { who: 'admin@renarvo.com', action: 'Approved company', target: 'Karpaz Drive', when: '2 min ago', sev: 'info' },
    { who: 'admin@renarvo.com', action: 'Suspended user', target: 'user_142', when: '18 min ago', sev: 'warn' },
    { who: 'system', action: 'Refunded reservation', target: 'RNV-10042 (€340)', when: '1h ago', sev: 'warn' },
    { who: 'maria@renarvo.com', action: 'Updated commission rate', target: '12% → 11.5%', when: '3h ago', sev: 'critical' },
    { who: 'admin@renarvo.com', action: 'Hidden review', target: 'review #5821', when: '5h ago', sev: 'info' },
    { who: 'system', action: 'Scheduled payout sent', target: '8 companies · €52,400', when: '1d ago', sev: 'info' },
    { who: 'admin@renarvo.com', action: 'Edited homepage banner', target: 'Summer hero', when: '2d ago', sev: 'info' },
  ];
  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Audit log</h1>
          <p className="text-muted-foreground mt-1">Every privileged action is recorded here</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search by user, action…" className="w-64" />
          <Button variant="outline"><FileSearch className="h-4 w-4 mr-1.5" /> Export</Button>
        </div>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Severity</th></tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                  <Clock className="h-3 w-3 inline mr-1.5" />{e.when}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{e.who}</td>
                <td className="px-4 py-3">{e.action}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.target}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={
                    e.sev === 'critical' ? 'border-destructive/40 text-destructive' :
                    e.sev === 'warn' ? 'border-warning/40 text-warning' :
                    'border-success/40 text-success'
                  }>
                    {e.sev}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ============== RISK & FRAUD ============== */
export function AdminRisk() {
  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Risk & fraud</h1>
        <p className="text-muted-foreground mt-1">Suspicious activity, chargebacks and account flags</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open flags" value={7} icon={ShieldAlert} accent="warning" />
        <StatCard label="Chargebacks (30d)" value={3} hint="0.4% rate" icon={AlertTriangle} accent="brand" />
        <StatCard label="Verified accounts" value="98.2%" trend={1} icon={CheckCircle2} accent="success" />
        <StatCard label="Avg. review time" value="14m" icon={Clock} accent="navy" />
      </div>

      <Card className="overflow-hidden">
        <div className="p-5 border-b font-display font-bold">Pending risk reviews</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr><th className="px-4 py-3">Type</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Action</th></tr>
          </thead>
          <tbody>
            {[
              { type: 'Booking', subj: 'RNV-10812', reason: 'New card · high value · IP mismatch', score: 78 },
              { type: 'Account', subj: 'user_3041', reason: '3 cancellations in 24h', score: 64 },
              { type: 'Company', subj: 'Olive Branch', reason: 'Unusual price change', score: 42 },
              { type: 'Review', subj: 'review #6190', reason: 'Suspected fake (5 in 1h)', score: 88 },
            ].map((r, i) => (
              <tr key={i} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3"><Badge variant="outline">{r.type}</Badge></td>
                <td className="px-4 py-3 font-mono text-xs">{r.subj}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.reason}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${r.score > 70 ? 'bg-destructive' : r.score > 50 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${r.score}%` }} />
                    </div>
                    <span className="text-xs font-semibold">{r.score}</span>
                  </div>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <Button size="sm" variant="outline">Investigate</Button>
                  <Button size="sm" className="bg-success text-success-foreground">Clear</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ============== NOTIFICATIONS / BROADCAST ============== */
export function AdminNotifications() {
  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Notifications</h1>
        <p className="text-muted-foreground mt-1">Send announcements to companies or customers</p>
      </div>

      <Tabs defaultValue="compose">
        <TabsList>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-4">
          <Card className="p-6 space-y-4">
            <div>
              <Label>Audience</Label>
              <select className="h-10 w-full rounded-lg border bg-background px-3 text-sm">
                <option>All companies (12)</option>
                <option>All customers (1,420)</option>
                <option>Customers in Girne</option>
                <option>Customers with active rentals</option>
              </select>
            </div>
            <div>
              <Label>Channel</Label>
              <div className="flex gap-3 mt-2">
                {['In-app', 'Email', 'SMS', 'WhatsApp'].map(c => (
                  <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" defaultChecked={c === 'In-app' || c === 'Email'} className="h-4 w-4" />
                    {c}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Subject</Label>
              <Input placeholder="Important update about your booking" />
            </div>
            <div>
              <Label>Message</Label>
              <textarea rows={6} className="w-full rounded-lg border bg-background p-3 text-sm" placeholder="Write your announcement…" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="bg-gradient-brand text-white border-0"><Send className="h-4 w-4 mr-1.5" /> Send now</Button>
              <Button variant="outline"><Clock className="h-4 w-4 mr-1.5" /> Schedule</Button>
              <Button variant="ghost">Save as draft</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr><th className="px-4 py-3">Sent</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Audience</th><th className="px-4 py-3">Channels</th><th className="px-4 py-3 text-right">Reach</th><th className="px-4 py-3 text-right">Open rate</th></tr>
              </thead>
              <tbody>
                {[
                  { sent: '2025-04-20', subj: 'Spring promo live', aud: 'All customers', ch: 'Email', reach: 1420, open: 38 },
                  { sent: '2025-04-15', subj: 'New pickup at Larnaca', aud: 'All companies', ch: 'In-app', reach: 12, open: 100 },
                  { sent: '2025-04-10', subj: 'Updated KDV rate', aud: 'All companies', ch: 'Email + In-app', reach: 12, open: 92 },
                ].map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.sent}</td>
                    <td className="px-4 py-3 font-semibold">{r.subj}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.aud}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{r.ch}</Badge></td>
                    <td className="px-4 py-3 text-right font-semibold">{r.reach.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-success font-semibold">{r.open}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {['Booking confirmed', 'Pickup reminder (24h)', 'Late return warning', 'Refund issued', 'Welcome new company', 'Document expiring soon'].map(t => (
              <Card key={t} className="p-5">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-1" />
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-sm">{t}</h3>
                    <p className="text-xs text-muted-foreground mt-1">System template, sent automatically</p>
                  </div>
                  <Button size="sm" variant="ghost">Edit</Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============== SYSTEM HEALTH ============== */
export function AdminSystem() {
  const services = [
    { name: 'API Gateway', status: 'operational', latency: '42ms', icon: Globe },
    { name: 'Database (Postgres)', status: 'operational', latency: '11ms', icon: Database },
    { name: 'Edge Functions', status: 'operational', latency: '88ms', icon: Cpu },
    { name: 'Image CDN', status: 'degraded', latency: '210ms', icon: Server },
    { name: 'Email (SMTP)', status: 'operational', latency: '320ms', icon: Mail },
    { name: 'Payment processor', status: 'operational', latency: '180ms', icon: Activity },
  ];
  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="font-display text-3xl font-extrabold">System health</h1>
        <p className="text-muted-foreground mt-1">Real-time status of platform services</p>
      </div>

      <Card className="p-5 flex items-center gap-4 border-success/40 bg-success/5">
        <div className="h-12 w-12 rounded-full bg-success/15 text-success flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="font-display font-bold">All systems operational</div>
          <div className="text-sm text-muted-foreground">99.98% uptime over the last 30 days</div>
        </div>
        <Button variant="outline" size="sm">Status page</Button>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        {services.map(s => {
          const Icon = s.icon;
          const colors = s.status === 'operational' ? 'border-success/30 text-success' : s.status === 'degraded' ? 'border-warning/30 text-warning' : 'border-destructive/30 text-destructive';
          return (
            <Card key={s.name} className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{s.name}</div>
                <div className="text-xs text-muted-foreground">Latency · {s.latency}</div>
              </div>
              <Badge variant="outline" className={colors}>{s.status}</Badge>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h3 className="font-display font-bold mb-3">Recent incidents</h3>
        <ScrollArea className="h-48">
          <div className="space-y-3 pr-4">
            {[
              { date: 'Apr 22 · 14:02', title: 'Image CDN slow in EU-West', status: 'Investigating' },
              { date: 'Apr 18 · 09:15', title: 'Email delivery delayed (~5 min)', status: 'Resolved' },
              { date: 'Apr 12 · 22:40', title: 'Brief API timeouts (2 min)', status: 'Resolved' },
            ].map((inc, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-sm">{inc.title}</div>
                  <div className="text-xs text-muted-foreground">{inc.date}</div>
                </div>
                <Badge variant="outline">{inc.status}</Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
