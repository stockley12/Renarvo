import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{t('panel.admin.nav.auditLog')}</h1>
          <p className="text-muted-foreground mt-1">{t('panel.admin.audit.subtitle')}</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="">{t('panel.admin.audit.allSeverities')}</option>
            <option value="info">{t('panel.admin.audit.severity.info')}</option>
            <option value="warning">{t('panel.admin.audit.severity.warning')}</option>
            <option value="critical">{t('panel.admin.audit.severity.critical')}</option>
          </select>
          <Input
            placeholder={t('panel.admin.audit.filterPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t('panel.admin.audit.when')}</th>
              <th className="px-4 py-3">{t('panel.admin.audit.actor')}</th>
              <th className="px-4 py-3">{t('panel.admin.audit.action')}</th>
              <th className="px-4 py-3">{t('panel.admin.audit.target')}</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">{t('panel.admin.audit.severityLabel')}</th>
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
                  {t('panel.admin.audit.none')}
                </td>
              </tr>
            )}
            {events.map((e) => (
              <tr key={e.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                  <Clock className="h-3 w-3 inline mr-1.5" />
                  {formatDate(e.created_at, locale)}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{e.actor_email ?? t('panel.admin.audit.system')}</td>
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
                    {t(`panel.admin.audit.severity.${e.severity}`)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  );
}

/* ============== NOTIFICATIONS / BROADCAST ============== */
export function AdminNotifications() {
  const { t } = useTranslation();
  const broadcast = useAdminBroadcast();
  const history = useAdminBroadcastHistory();
  const [audience, setAudience] = useState('all');
  const [channels, setChannels] = useState<('email' | 'in_app')[]>(['in_app', 'email']);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error(t('panel.admin.notifications.validationSubjectBody'));
      return;
    }
    if (channels.length === 0) {
      toast.error(t('panel.admin.notifications.validationChannel'));
      return;
    }
    try {
      await broadcast.mutateAsync({ audience, channels, subject, body });
      toast.success(t('panel.admin.notifications.queued'));
      setSubject('');
      setBody('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.admin.notifications.sendFailed'));
    }
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{t('panel.admin.notifications.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('panel.admin.notifications.subtitle')}</p>
      </div>

      <Tabs defaultValue="compose">
        <TabsList>
          <TabsTrigger value="compose">{t('panel.admin.notifications.compose')}</TabsTrigger>
          <TabsTrigger value="history">{t('panel.admin.notifications.history')}</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-4">
          <form onSubmit={send}>
            <Card className="p-6 space-y-4">
              <div>
                <Label>{t('panel.admin.notifications.audience')}</Label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                >
                  <option value="all">{t('panel.admin.notifications.audienceEveryone')}</option>
                  <option value="customers">{t('panel.admin.notifications.audienceCustomers')}</option>
                  <option value="companies">{t('panel.admin.notifications.audienceCompanyOwners')}</option>
                  <option value="company_owners">{t('panel.admin.notifications.audienceCompanyOwnersAlias')}</option>
                  <option value="company_staff">{t('panel.admin.notifications.audienceCompanyStaff')}</option>
                </select>
              </div>
              <div>
                <Label>{t('panel.admin.notifications.channels')}</Label>
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
                      {c === 'in_app' ? t('panel.admin.notifications.channelInApp') : t('panel.admin.notifications.channelEmail')}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>{t('panel.admin.notifications.subject')}</Label>
                <Input
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t('panel.admin.notifications.subjectPlaceholder')}
                />
              </div>
              <div>
                <Label>{t('panel.admin.notifications.message')}</Label>
                <Textarea
                  rows={6}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={t('panel.admin.notifications.messagePlaceholder')}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={broadcast.isPending} className="bg-gradient-brand text-white border-0">
                  {broadcast.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  <Send className="h-4 w-4 mr-1.5" /> {t('panel.admin.notifications.sendNow')}
                </Button>
              </div>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{t('panel.admin.notifications.sent')}</th>
                  <th className="px-4 py-3">{t('panel.admin.notifications.subject')}</th>
                  <th className="px-4 py-3">{t('panel.admin.notifications.audience')}</th>
                  <th className="px-4 py-3">{t('panel.admin.notifications.channels')}</th>
                  <th className="px-4 py-3 text-right">{t('panel.admin.notifications.reach')}</th>
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
                      {t('panel.admin.notifications.noneYet')}
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
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============== SYSTEM HEALTH ============== */
export function AdminSystem() {
  const { t } = useTranslation();
  const health = useAdminSystemHealth();
  const h = health.data;

  if (health.isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-6 w-6 mr-2 animate-spin" /> {t('panel.admin.system.loading')}
      </div>
    );
  }

  if (!h) {
    return <div className="text-muted-foreground">{t('panel.admin.system.unavailable')}</div>;
  }

  const ok = h.database.ok && h.fx.fresh && h.jobs.failed_7d === 0;
  const services = [
    {
      name: t('panel.admin.system.serviceDatabase'),
      icon: Database,
      ok: h.database.ok,
      info: h.database.latency_ms !== null ? t('panel.admin.system.latency', { ms: h.database.latency_ms }) : t('panel.admin.system.connectionFailed'),
    },
    {
      name: t('panel.admin.system.serviceDisk'),
      icon: Server,
      ok: h.disk.used_pct !== null && h.disk.used_pct < 90,
      info:
        h.disk.used_pct !== null
          ? t('panel.admin.system.diskUsed', { used: h.disk.used_pct, total: (h.disk.total_bytes / 1024 ** 3).toFixed(1) })
          : t('panel.admin.system.unknown'),
    },
    {
      name: t('panel.admin.system.serviceFx'),
      icon: Globe,
      ok: h.fx.fresh,
      info: h.fx.last_refresh ? t('panel.admin.system.lastRefresh', { value: h.fx.last_refresh }) : t('panel.admin.system.neverRefreshed'),
    },
    {
      name: t('panel.admin.system.serviceQueue'),
      icon: Cpu,
      ok: h.jobs.failed_7d === 0,
      info: t('panel.admin.system.queueInfo', { pending: h.jobs.pending, failed: h.jobs.failed_7d }),
    },
    {
      name: t('panel.admin.system.servicePhp'),
      icon: Activity,
      ok: true,
      info: t('panel.admin.system.phpInfo', { version: h.php.version, opcache: h.php.opcache_enabled ? t('common.on') : t('common.off'), memory: h.php.memory_peak_mb }),
    },
    {
      name: t('panel.admin.system.serviceMailer'),
      icon: Mail,
      ok: h.mail.configured,
      info: h.mail.configured
        ? t('panel.admin.system.mailerInfoConfigured', { mailer: h.mail.mailer.toUpperCase(), host: h.mail.host, port: h.mail.port })
        : t('panel.admin.system.mailerInfoNotConfigured', { mailer: h.mail.mailer.toUpperCase() }),
    },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{t('panel.admin.nav.systemHealth')}</h1>
        <p className="text-muted-foreground mt-1">{t('panel.admin.system.subtitle')}</p>
      </div>

      <Card className={`p-5 flex items-center gap-4 ${ok ? 'border-success/40 bg-success/5' : 'border-warning/40 bg-warning/5'}`}>
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${ok ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
          {ok ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
        </div>
        <div className="flex-1">
          <div className="font-display font-bold">{ok ? t('panel.admin.system.allOperational') : t('panel.admin.system.needsAttention')}</div>
          <div className="text-sm text-muted-foreground">{t('panel.admin.system.autoRefresh')}</div>
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
                {s.ok ? t('panel.admin.system.operational') : t('panel.admin.system.attention')}
              </Badge>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h3 className="font-display font-bold mb-3">{t('panel.admin.system.notes')}</h3>
        <ScrollArea className="h-32">
          <div className="space-y-2 pr-4 text-sm text-muted-foreground">
            <p>{t('panel.admin.system.databaseLine', { status: h.database.ok ? t('panel.admin.system.databaseConnected', { ms: h.database.latency_ms ?? 0 }) : t('panel.admin.system.connectionFailed') })}</p>
            {h.jobs.last_run_at && <p>{t('panel.admin.system.lastQueueRun', { value: h.jobs.last_run_at })}</p>}
            <p>
              {t('panel.admin.system.mailerLine', {
                mailer: h.mail.mailer,
                configured: h.mail.configured
                  ? t('panel.admin.system.smtpConfigured', { address: h.mail.from_address })
                  : t('panel.admin.system.smtpNotConfigured'),
              })}
            </p>
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
