import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  Activity, AlertTriangle, Server, Database, Globe, Cpu,
  CheckCircle2, Clock, Send, Mail, Loader2, FileSearch, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminAuditLog,
  useAdminBroadcast,
  useAdminBroadcastHistory,
  useAdminSystemHealth,
} from '@/lib/hooks/useAdmin';
import { formatDate } from '@/lib/format';
import { useApp } from '@/store/app';

/* ============== AUDIT LOG ============== */
export function AdminAuditLog() {
  const { locale } = useApp();
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const log = useAdminAuditLog({
    severity: severity || undefined,
    action: search || undefined,
    limit: 100,
  });
  const events = log.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Audit log</h1>
          <p className="text-muted-foreground mt-1">Every privileged action is recorded here</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="">All severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <Input
            placeholder="Filter by action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Severity</th>
            </tr>
          </thead>
          <tbody>
            {log.isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                </td>
              </tr>
            )}
            {!log.isLoading && events.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <FileSearch className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  No audit events match your filter
                </td>
              </tr>
            )}
            {events.map((e) => (
              <tr key={e.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                  <Clock className="h-3 w-3 inline mr-1.5" />
                  {formatDate(e.created_at, locale)}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{e.actor_email ?? `system`}</td>
                <td className="px-4 py-3">{e.action}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {e.target_type ? `${e.target_type} #${e.target_id}` : '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{e.ip_address ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={
                      e.severity === 'critical'
                        ? 'border-destructive/40 text-destructive'
                        : e.severity === 'warning'
                          ? 'border-warning/40 text-warning'
                          : 'border-success/40 text-success'
                    }
                  >
                    {e.severity}
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

/* ============== NOTIFICATIONS / BROADCAST ============== */
export function AdminNotifications() {
  const broadcast = useAdminBroadcast();
  const history = useAdminBroadcastHistory();
  const [audience, setAudience] = useState('all');
  const [channels, setChannels] = useState<('email' | 'in_app')[]>(['in_app', 'email']);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and message are required');
      return;
    }
    if (channels.length === 0) {
      toast.error('Pick at least one channel');
      return;
    }
    try {
      await broadcast.mutateAsync({ audience, channels, subject, body });
      toast.success('Broadcast queued for delivery');
      setSubject('');
      setBody('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send broadcast');
    }
  }

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
        </TabsList>

        <TabsContent value="compose" className="mt-4">
          <form onSubmit={send}>
            <Card className="p-6 space-y-4">
              <div>
                <Label>Audience</Label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                >
                  <option value="all">Everyone</option>
                  <option value="customers">Customers only</option>
                  <option value="companies">Company owners</option>
                  <option value="company_owners">Company owners (alias)</option>
                  <option value="company_staff">Company staff</option>
                </select>
              </div>
              <div>
                <Label>Channels</Label>
                <div className="flex gap-3 mt-2">
                  {(['in_app', 'email'] as const).map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={channels.includes(c)}
                        onChange={(e) => {
                          if (e.target.checked) setChannels((cs) => [...cs, c]);
                          else setChannels((cs) => cs.filter((x) => x !== c));
                        }}
                        className="h-4 w-4"
                      />
                      {c === 'in_app' ? 'In-app' : 'Email'}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Important update about your booking"
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  rows={6}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your announcement..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={broadcast.isPending} className="bg-gradient-brand text-white border-0">
                  {broadcast.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  <Send className="h-4 w-4 mr-1.5" /> Send now
                </Button>
              </div>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Sent</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Audience</th>
                  <th className="px-4 py-3">Channels</th>
                  <th className="px-4 py-3 text-right">Reach</th>
                </tr>
              </thead>
              <tbody>
                {history.isLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                    </td>
                  </tr>
                )}
                {!history.isLoading && (history.data?.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      No broadcasts sent yet
                    </td>
                  </tr>
                )}
                {(history.data ?? []).map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.sent_at?.slice(0, 10)}</td>
                    <td className="px-4 py-3 font-semibold">{b.subject}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{b.audience.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{(b.channels ?? []).join(' + ')}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {(b.total_recipients ?? 0).toLocaleString()}
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

/* ============== SYSTEM HEALTH ============== */
export function AdminSystem() {
  const health = useAdminSystemHealth();
  const h = health.data;

  if (health.isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-6 w-6 mr-2 animate-spin" /> Loading system telemetry...
      </div>
    );
  }

  if (!h) {
    return <div className="text-muted-foreground">System health unavailable.</div>;
  }

  const ok = h.database.ok && h.fx.fresh && h.jobs.failed_7d === 0;
  const services = [
    {
      name: 'Database',
      icon: Database,
      ok: h.database.ok,
      info: h.database.latency_ms !== null ? `Latency · ${h.database.latency_ms}ms` : 'Connection failed',
    },
    {
      name: 'Disk',
      icon: Server,
      ok: h.disk.used_pct !== null && h.disk.used_pct < 90,
      info:
        h.disk.used_pct !== null
          ? `Used · ${h.disk.used_pct}% of ${(h.disk.total_bytes / 1024 ** 3).toFixed(1)} GB`
          : 'Unknown',
    },
    {
      name: 'FX rates',
      icon: Globe,
      ok: h.fx.fresh,
      info: h.fx.last_refresh ? `Last refresh · ${h.fx.last_refresh}` : 'Never refreshed',
    },
    {
      name: 'Jobs queue',
      icon: Cpu,
      ok: h.jobs.failed_7d === 0,
      info: `${h.jobs.pending} pending · ${h.jobs.failed_7d} failed (7d)`,
    },
    {
      name: 'PHP runtime',
      icon: Activity,
      ok: true,
      info: `v${h.php.version} · OPcache ${h.php.opcache_enabled ? 'on' : 'off'} · ${h.php.memory_peak_mb}MB peak`,
    },
    {
      name: 'Email (mailer)',
      icon: Mail,
      ok: h.mail.configured,
      info: h.mail.configured
        ? `${h.mail.mailer.toUpperCase()} · ${h.mail.host}:${h.mail.port}`
        : `${h.mail.mailer.toUpperCase()} mode (SMTP not configured)`,
    },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="font-display text-3xl font-extrabold">System health</h1>
        <p className="text-muted-foreground mt-1">Real-time status of platform services</p>
      </div>

      <Card className={`p-5 flex items-center gap-4 ${ok ? 'border-success/40 bg-success/5' : 'border-warning/40 bg-warning/5'}`}>
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${ok ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
          {ok ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
        </div>
        <div className="flex-1">
          <div className="font-display font-bold">{ok ? 'All systems operational' : 'Some checks need attention'}</div>
          <div className="text-sm text-muted-foreground">Auto-refreshing every 30s</div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        {services.map((s) => {
          const Icon = s.icon;
          const colors = s.ok ? 'border-success/30 text-success' : 'border-destructive/30 text-destructive';
          return (
            <Card key={s.name} className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.info}</div>
              </div>
              <Badge variant="outline" className={colors}>
                {s.ok ? 'operational' : 'attention'}
              </Badge>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h3 className="font-display font-bold mb-3">Notes</h3>
        <ScrollArea className="h-32">
          <div className="space-y-2 pr-4 text-sm text-muted-foreground">
            <p>Database: {h.database.ok ? `Connected, ${h.database.latency_ms}ms latency.` : 'Connection failed.'}</p>
            {h.jobs.last_run_at && <p>Last queue run: {h.jobs.last_run_at}.</p>}
            <p>
              Mailer: {h.mail.mailer}. {h.mail.configured
                ? `SMTP is configured for ${h.mail.from_address}.`
                : 'SMTP is not configured yet.'}
            </p>
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
