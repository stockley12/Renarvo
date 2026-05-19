import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Plus, MapPin, Star, FileText, AlertCircle, Loader2, Trash2, Search, Shield, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/store/app';
import { formatPrice, formatDate } from '@/lib/format';
import {
  useCompanyCustomers,
  useCompanyBranches,
  useCreateBranch,
  useDeleteBranch,
  useCompanyStaff,
  useInviteStaff,
  useRemoveStaff,
  useCompanyReviews,
  useReplyReview,
  useCompanyPayouts,
  useUpdateBankAccount,
  useCompanyDocuments,
  uploadCompanyDocument,
  useCompanySettings,
  useUpdateCompanySettings,
  useCompanyExtras,
  useCreateCompanyExtra,
  useUpdateCompanyExtra,
  useDeleteCompanyExtra,
  useInsurancePackages,
  useCreateInsurancePackage,
  useUpdateInsurancePackage,
  useDeleteInsurancePackage,
  type CompanyExtra,
  type InsurancePackage,
} from '@/lib/hooks/useCompany';
import { useQueryClient } from '@tanstack/react-query';

/* ============== CUSTOMERS ============== */
export function DashCustomers() {
  const { t } = useTranslation();
  const { currency, locale } = useApp();
  const [q, setQ] = useState('');
  const customers = useCompanyCustomers({ search: q || undefined, limit: 100 });
  const items = customers.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">{t('panel.company.nav.customers')}</h1>
      </div>
      <Card className="p-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('panel.company.sections.customers.searchPlaceholder')}
            className="pl-9 border-0 bg-transparent"
          />
        </div>
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">{t('panel.common.customer')}</th>
              <th className="px-4 py-3 font-medium">{t('auth.register.phone')}</th>
              <th className="px-4 py-3 font-medium">{t('panel.company.stats.bookings')}</th>
              <th className="px-4 py-3 font-medium text-right">{t('panel.company.sections.customers.totalSpent')}</th>
              <th className="px-4 py-3 font-medium">{t('panel.company.sections.customers.lastBooking')}</th>
            </tr>
          </thead>
          <tbody>
            {customers.isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                </td>
              </tr>
            )}
            {!customers.isLoading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  {t('panel.company.sections.customers.noCustomers')}
                </td>
              </tr>
            )}
            {items.map((c) => (
              <tr key={c.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-gradient-brand text-white text-xs">
                        {c.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary">{c.total_bookings}</Badge>
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatPrice(c.total_spent, currency, locale)}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {c.last_booking ? formatDate(c.last_booking, locale) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ============== BRANCHES ============== */
export function DashBranches() {
  const { t } = useTranslation();
  const branches = useCompanyBranches();
  const create = useCreateBranch();
  const remove = useDeleteBranch();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !address) {
      toast.error(t('panel.company.sections.branches.toasts.nameAddressRequired'));
      return;
    }
    try {
      await create.mutateAsync({ name, address, city: city || null, latitude: null, longitude: null, opening_hours: null });
      toast.success(t('panel.company.sections.branches.toasts.branchAdded'));
      setCreating(false);
      setName('');
      setAddress('');
      setCity('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.sections.branches.toasts.couldNotAddBranch'));
    }
  }

  async function onDelete(id: number) {
    if (!window.confirm(t('panel.company.sections.branches.confirms.deleteBranch'))) return;
    try {
      await remove.mutateAsync(id);
      toast.success(t('panel.company.sections.branches.toasts.branchDeleted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.sections.branches.toasts.couldNotDelete'));
    }
  }

  const items = branches.data ?? [];

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold">{t('panel.company.nav.branches')}</h1>
        <Button className="bg-gradient-brand text-white border-0" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          {t('panel.company.sections.branches.addBranch')}
        </Button>
      </div>

      {creating && (
        <Card className="p-5">
          <form onSubmit={onCreate} className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>{t('auth.register.name')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('panel.company.sections.branches.namePlaceholder')} />
            </div>
            <div>
              <Label>{t('common.city')}</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t('panel.company.sections.branches.cityPlaceholder')} />
            </div>
            <div>
              <Label>{t('panel.company.sections.branches.address')}</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('panel.company.sections.branches.addressPlaceholder')} />
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <Button type="submit" disabled={create.isPending} className="bg-gradient-brand text-white border-0">
                {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {t('common.save')}
              </Button>
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {branches.isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {!branches.isLoading && items.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
          {t('panel.company.sections.branches.noBranches')}
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {items.map((b) => (
          <Card key={b.id} className="p-5">
            <div className="flex justify-between items-start gap-3">
              <div>
                <h3 className="font-display font-bold">{b.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{b.address}</p>
                {b.city && <p className="text-xs text-muted-foreground mt-1">{b.city}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => onDelete(b.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============== STAFF ============== */
export function DashStaff() {
  const { t } = useTranslation();
  const staff = useCompanyStaff();
  const invite = useInviteStaff();
  const remove = useRemoveStaff();
  const [inviting, setInviting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'manager' | 'agent'>('agent');

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) {
      toast.error(t('panel.company.sections.staff.toasts.nameEmailRequired'));
      return;
    }
    try {
      await invite.mutateAsync({ name, email, role });
      toast.success(t('panel.company.sections.staff.toasts.memberInvited', { name }));
      setInviting(false);
      setName('');
      setEmail('');
      setRole('agent');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.sections.staff.toasts.couldNotInviteStaff'));
    }
  }

  async function onRemove(id: number) {
    if (!window.confirm(t('panel.company.sections.staff.confirms.removeStaffMember'))) return;
    try {
      await remove.mutateAsync(id);
      toast.success(t('panel.company.sections.staff.toasts.staffRemoved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.sections.staff.toasts.couldNotRemove'));
    }
  }

  const items = staff.data ?? [];

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold">{t('panel.company.nav.staff')}</h1>
        <Button className="bg-gradient-brand text-white border-0" onClick={() => setInviting(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> {t('panel.company.sections.staff.inviteMember')}
        </Button>
      </div>

      {inviting && (
        <Card className="p-5">
          <form onSubmit={onInvite} className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>{t('auth.register.name')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>{t('auth.register.email')}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>{t('panel.company.sections.staff.role')}</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'manager' | 'agent')}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                <option value="manager">{t('panel.company.sections.staff.roles.manager')}</option>
                <option value="agent">{t('panel.company.sections.staff.roles.agent')}</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <Button type="submit" disabled={invite.isPending} className="bg-gradient-brand text-white border-0">
                {invite.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {t('panel.company.sections.staff.sendInvite')}
              </Button>
              <Button type="button" variant="outline" onClick={() => setInviting(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">{t('auth.register.name')}</th>
              <th className="px-4 py-3 font-medium">{t('auth.register.email')}</th>
              <th className="px-4 py-3 font-medium">{t('panel.company.sections.staff.role')}</th>
              <th className="px-4 py-3 font-medium w-16"></th>
            </tr>
          </thead>
          <tbody>
            {staff.isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                </td>
              </tr>
            )}
            {!staff.isLoading && items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  {t('panel.company.sections.staff.noStaff')}
                </td>
              </tr>
            )}
            {items.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-3 font-semibold">{s.user?.name ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.user?.email ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="capitalize">
                    {s.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="icon" onClick={() => onRemove(s.id)} disabled={remove.isPending}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ============== REVIEWS ============== */
export function DashReviews() {
  const { t } = useTranslation();
  const reviews = useCompanyReviews();
  const reply = useReplyReview();
  const [replying, setReplying] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  async function onReply(id: number) {
    if (!replyText.trim()) {
      toast.error(t('panel.company.sections.reviews.toasts.replyCannotBeEmpty'));
      return;
    }
    try {
      await reply.mutateAsync({ id, text: replyText });
      toast.success(t('panel.company.sections.reviews.toasts.replyPosted'));
      setReplying(null);
      setReplyText('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.sections.reviews.toasts.couldNotPostReply'));
    }
  }

  const items = reviews.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="font-display text-3xl font-extrabold">{t('panel.company.nav.reviews')}</h1>
      {reviews.isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {!reviews.isLoading && items.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          {t('panel.company.sections.reviews.noReviews')}
        </Card>
      )}
      <div className="grid gap-4">
        {items.map((r) => {
          const carLabel = r.car ? `${r.car.brand} ${r.car.model}` : '';
          return (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{r.customer?.name ?? t('panel.company.sections.reviews.guest')}</span>
                    {carLabel && <Badge variant="outline">{carLabel}</Badge>}
                  </div>
                  <div className="flex gap-0.5 my-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className={`h-4 w-4 ${j < r.rating ? 'fill-warning text-warning' : 'text-muted'}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{r.comment}</p>
                  {r.company_reply && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/40 text-sm border-l-2 border-primary">
                      <div className="font-semibold text-xs text-primary mb-1">{t('panel.company.sections.reviews.yourReply')}</div>
                      {r.company_reply}
                    </div>
                  )}
                </div>
                {!r.company_reply && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplying(r.id);
                      setReplyText('');
                    }}
                  >
                    {t('panel.company.sections.reviews.reply')}
                  </Button>
                )}
              </div>
              {replying === r.id && (
                <div className="mt-4 space-y-2">
                  <Textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={t('panel.company.sections.reviews.typeResponse')}
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => onReply(r.id)} disabled={reply.isPending} className="bg-gradient-brand text-white border-0">
                      {t('panel.company.sections.reviews.postReply')}
                    </Button>
                    <Button variant="ghost" onClick={() => setReplying(null)}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ============== PAYOUTS ============== */
export function DashPayouts() {
  const { t } = useTranslation();
  const { currency, locale } = useApp();
  const payouts = useCompanyPayouts();
  const updateBank = useUpdateBankAccount();

  const [iban, setIban] = useState('');
  const [holder, setHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [primed, setPrimed] = useState(false);

  if (!primed && payouts.data?.bank_account) {
    setIban(payouts.data.bank_account.iban);
    setHolder(payouts.data.bank_account.account_holder);
    setBankName(payouts.data.bank_account.bank_name ?? '');
    setPrimed(true);
  }

  async function onSaveBank(e: React.FormEvent) {
    e.preventDefault();
    if (!iban || !holder) {
      toast.error(t('panel.company.sections.payouts.toasts.ibanHolderRequired'));
      return;
    }
    try {
      await updateBank.mutateAsync({ iban, account_holder: holder, bank_name: bankName || undefined });
      toast.success(t('panel.company.sections.payouts.toasts.bankAccountSaved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.sections.payouts.toasts.couldNotSaveBank'));
    }
  }

  const ps = payouts.data?.payouts ?? [];

  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="font-display text-3xl font-extrabold">{t('panel.company.nav.payouts')}</h1>
      <Card className="p-6">
        <h3 className="font-display font-bold mb-4">{t('panel.company.sections.payouts.bankAccount')}</h3>
        <form onSubmit={onSaveBank} className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('panel.company.sections.payouts.iban')}</Label>
            <Input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="TR00 0000 0000 0000 0000 0000 00" />
          </div>
          <div>
            <Label>{t('panel.company.sections.payouts.accountHolder')}</Label>
            <Input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder={t('panel.company.sections.payouts.accountHolderPlaceholder')} />
          </div>
          <div className="sm:col-span-2">
            <Label>{t('panel.company.sections.payouts.bankOptional')}</Label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="İş Bankası" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={updateBank.isPending} className="bg-gradient-brand text-white border-0">
              {updateBank.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {t('panel.company.sections.payouts.saveBankInfo')}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-5 border-b font-display font-bold">{t('panel.company.sections.payouts.payoutHistory')}</div>
        {payouts.isLoading ? (
          <div className="py-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : ps.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">{t('panel.company.sections.payouts.noPayouts')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t('panel.admin.finance.period')}</th>
                <th className="px-4 py-3">{t('panel.common.status')}</th>
                <th className="px-4 py-3">{t('panel.company.sections.payouts.paid')}</th>
                <th className="px-4 py-3 text-right">{t('panel.admin.finance.net')}</th>
              </tr>
            </thead>
            <tbody>
              {ps.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">{p.period}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="capitalize">
                      {t(`panel.admin.finance.status.${p.status}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {p.paid_at ? formatDate(p.paid_at, locale) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPrice(p.amount, currency, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

/* ============== DOCUMENTS ============== */
const docTypes = [
  { value: 'trade_registry', labelKey: 'panel.company.sections.documents.docTypes.tradeRegistry' },
  { value: 'tax_certificate', labelKey: 'panel.company.sections.documents.docTypes.taxCertificate' },
  { value: 'operating_license', labelKey: 'panel.company.sections.documents.docTypes.operatingLicense' },
  { value: 'insurance', labelKey: 'panel.company.sections.documents.docTypes.insuranceCertificate' },
] as const;

export function DashDocuments() {
  const { t } = useTranslation();
  const { locale } = useApp();
  const qc = useQueryClient();
  const docs = useCompanyDocuments();
  const [uploading, setUploading] = useState(false);
  const [type, setType] = useState<typeof docTypes[number]['value']>('trade_registry');
  const [file, setFile] = useState<File | null>(null);
  const [expires, setExpires] = useState('');

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error(t('panel.company.sections.documents.toasts.pickFileFirst'));
      return;
    }
    setUploading(true);
    try {
      await uploadCompanyDocument({ type, file, expires_at: expires || null });
      toast.success(t('panel.company.sections.documents.toasts.documentUploaded'));
      setFile(null);
      setExpires('');
      qc.invalidateQueries({ queryKey: ['company', 'documents'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.sections.documents.toasts.uploadFailed'));
    } finally {
      setUploading(false);
    }
  }

  const items = docs.data ?? [];

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="font-display text-3xl font-extrabold">{t('panel.company.nav.documents')}</h1>

      <Card className="p-5">
        <h3 className="font-display font-bold mb-4">{t('panel.company.sections.documents.uploadNewDocument')}</h3>
        <form onSubmit={onUpload} className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>{t('panel.company.sections.documents.type')}</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                {docTypes.map((docType) => (
                  <option key={docType.value} value={docType.value}>
                    {t(docType.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t('panel.company.sections.documents.expiresOptional')}</Label>
              <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
            </div>
            <div>
              <Label>{t('panel.company.sections.documents.fileLabel')}</Label>
              <Input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <Button type="submit" disabled={uploading} className="bg-gradient-brand text-white border-0">
            {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {t('panel.company.sections.documents.upload')}
          </Button>
        </form>
      </Card>

      {docs.isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {!docs.isLoading && items.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
          {t('panel.company.sections.documents.noDocuments')}
        </Card>
      )}
      {items.map((d) => {
        const expiring = d.expires_at && new Date(d.expires_at) < new Date(Date.now() + 30 * 86400_000);
        const label = docTypes.find((docType) => docType.value === d.type);
        return (
          <Card key={d.id} className="p-5 flex items-center gap-4">
            <FileText className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <div className="font-semibold">{label ? t(label.labelKey) : d.type}</div>
              <div className="text-xs text-muted-foreground">
                {d.expires_at
                  ? t('panel.company.sections.documents.expiresOn', { date: formatDate(d.expires_at, locale) })
                  : t('panel.company.sections.documents.noExpiry')}
              </div>
            </div>
            {expiring && <AlertCircle className="h-4 w-4 text-warning" />}
            <Badge
              variant={d.status === 'approved' ? 'secondary' : 'outline'}
              className={
                d.status === 'rejected'
                  ? 'border-destructive text-destructive'
                  : d.status === 'pending'
                  ? 'border-warning text-warning'
                  : ''
              }
            >
              {d.status}
            </Badge>
          </Card>
        );
      })}
    </div>
  );
}

/* ============== SETTINGS ============== */
export function DashSettings() {
  const { t } = useTranslation();
  const settings = useCompanySettings();
  const update = useUpdateCompanySettings();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [languages, setLanguages] = useState('');

  // Rental policy
  const [minRentalDays, setMinRentalDays] = useState(1);
  const [kmPolicy, setKmPolicy] = useState<'unlimited' | 'per_day_limit' | 'total_limit'>('unlimited');
  const [kmLimit, setKmLimit] = useState<number | ''>('');
  const [minAge, setMinAge] = useState(21);
  const [studentFriendly, setStudentFriendly] = useState(false);
  const [roadside247, setRoadside247] = useState(false);

  // Public contact / social
  const [emailPublic, setEmailPublic] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [website, setWebsite] = useState('');

  const [primed, setPrimed] = useState(false);

  if (!primed && settings.data) {
    const s = settings.data;
    setName(s.name ?? '');
    setDescription(s.description ?? '');
    setCity(s.city ?? '');
    setLanguages(s.languages_spoken ?? '');
    setPhone(s.phone ?? '');
    setAddress(s.address ?? '');
    setMinRentalDays(s.min_rental_days ?? 1);
    setKmPolicy(s.kilometre_policy ?? 'unlimited');
    setKmLimit(s.kilometre_limit_per_day_default ?? '');
    setMinAge(s.min_driver_age_default ?? 21);
    setStudentFriendly(!!s.student_friendly);
    setRoadside247(!!s.roadside_24_7);
    setEmailPublic(s.email_public ?? '');
    setWhatsapp(s.whatsapp ?? '');
    setInstagram(s.instagram ?? '');
    setFacebook(s.facebook ?? '');
    setWebsite(s.website ?? '');
    setPrimed(true);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await update.mutateAsync({
        name,
        description,
        phone,
        address,
        city,
        languages_spoken: languages,
        min_rental_days: Math.max(1, Math.min(30, Number(minRentalDays) || 1)),
        kilometre_policy: kmPolicy,
        kilometre_limit_per_day_default: kmPolicy === 'unlimited' ? null : (Number(kmLimit) || null),
        min_driver_age_default: Math.max(18, Math.min(99, Number(minAge) || 21)),
        student_friendly: studentFriendly,
        roadside_24_7: roadside247,
        email_public: emailPublic || undefined,
        whatsapp: whatsapp || undefined,
        instagram: instagram || undefined,
        facebook: facebook || undefined,
        website: website || undefined,
      });
      toast.success(t('panel.company.sections.settings.toasts.settingsSaved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.sections.settings.toasts.couldNotSave'));
    }
  }

  if (settings.isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-6 w-6 mr-2 animate-spin" /> {t('panel.admin.settings.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="font-display text-3xl font-extrabold">{t('panel.company.nav.settings')}</h1>
      <form onSubmit={onSave} className="space-y-5">
        <Card className="p-6 space-y-4">
          <h3 className="font-display font-bold">{t('panel.company.sections.settings.companyProfile')}</h3>
          <div>
            <Label>{t('auth.registerCompany.companyName')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>{t('auth.registerCompany.description')}</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>{t('common.city')}</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <Label>{t('panel.company.sections.settings.phoneInternal')}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>{t('panel.company.sections.settings.address')}</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <Label>{t('panel.company.sections.settings.languagesSpoken')}</Label>
            <Input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder={t('panel.company.sections.settings.languagesPlaceholder')} />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-display font-bold">{t('panel.company.sections.settings.rentalPolicy')}</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>{t('panel.company.sections.settings.minimumRentalDays')}</Label>
              <Input type="number" min={1} max={30} value={minRentalDays} onChange={(e) => setMinRentalDays(Number(e.target.value) || 1)} />
            </div>
            <div>
              <Label>{t('panel.company.sections.settings.minimumDriverAge')}</Label>
              <Input type="number" min={18} max={99} value={minAge} onChange={(e) => setMinAge(Number(e.target.value) || 21)} />
            </div>
            <div>
              <Label>{t('panel.company.sections.settings.kilometrePolicy')}</Label>
              <select
                value={kmPolicy}
                onChange={(e) => setKmPolicy(e.target.value as typeof kmPolicy)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                <option value="unlimited">{t('panel.company.sections.settings.kmPolicy.unlimited')}</option>
                <option value="per_day_limit">{t('panel.company.sections.settings.kmPolicy.perDayLimit')}</option>
                <option value="total_limit">{t('panel.company.sections.settings.kmPolicy.totalLimit')}</option>
              </select>
            </div>
          </div>
          {kmPolicy !== 'unlimited' && (
            <div>
              <Label>{t('panel.company.sections.settings.kmLimitPerDay')}</Label>
              <Input type="number" min={50} max={5000} value={kmLimit} onChange={(e) => setKmLimit(e.target.value === '' ? '' : Number(e.target.value))} placeholder="200" />
            </div>
          )}
          <div className="flex items-center justify-between border-t pt-3">
            <div>
              <div className="font-semibold text-sm">{t('panel.company.sections.settings.studentFriendly')}</div>
              <div className="text-xs text-muted-foreground">{t('panel.company.sections.settings.studentFriendlyHint')}</div>
            </div>
            <Switch checked={studentFriendly} onCheckedChange={setStudentFriendly} />
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <div>
              <div className="font-semibold text-sm">{t('panel.company.sections.settings.roadside247')}</div>
              <div className="text-xs text-muted-foreground">{t('panel.company.sections.settings.roadside247Hint')}</div>
            </div>
            <Switch checked={roadside247} onCheckedChange={setRoadside247} />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-display font-bold">{t('panel.company.sections.settings.publicContactSocial')}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>{t('panel.company.sections.settings.publicEmail')}</Label>
              <Input type="email" value={emailPublic} onChange={(e) => setEmailPublic(e.target.value)} placeholder="info@yourcompany.com" />
            </div>
            <div>
              <Label>{t('footer.whatsapp')}</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+90 533 ..." />
            </div>
            <div>
              <Label>{t('footer.instagram')}</Label>
              <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@yourcompany" />
            </div>
            <div>
              <Label>{t('footer.facebook')}</Label>
              <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="facebook.com/yourcompany" />
            </div>
            <div className="sm:col-span-2">
              <Label>{t('panel.company.sections.settings.website')}</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" />
            </div>
          </div>
        </Card>

        <Separator className="my-2" />
        <Button type="submit" disabled={update.isPending} className="bg-gradient-brand text-white border-0">
          {update.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {t('common.saveChanges')}
        </Button>
      </form>
    </div>
  );
}

/* ============== EXTRAS CATALOG ============== */
const EXTRA_CODE_OPTIONS: { code: string; labelKey: string }[] = [
  { code: 'gps', labelKey: 'booking.gps' },
  { code: 'child_seat', labelKey: 'booking.childSeat' },
  { code: 'baby_seat', labelKey: 'booking.babySeat' },
  { code: 'additional_driver', labelKey: 'booking.additionalDriver' },
  { code: 'wifi', labelKey: 'panel.company.sections.extras.optionLabels.mobileWifi' },
  { code: 'border_crossing', labelKey: 'panel.company.sections.extras.optionLabels.borderCrossing' },
  { code: 'custom', labelKey: 'panel.company.sections.extras.optionLabels.custom' },
];

export function DashExtras() {
  const { t } = useTranslation();
  const extras = useCompanyExtras();
  const create = useCreateCompanyExtra();
  const update = useUpdateCompanyExtra();
  const remove = useDeleteCompanyExtra();

  const items = extras.data ?? [];

  function blank(): Partial<CompanyExtra> {
    return {
      code: 'gps',
      name: t('booking.gps'),
      price_per_day: 0,
      price_per_rental: 0,
      charge_mode: 'per_day',
      is_active: true,
      sort_order: 0,
    };
  }

  const [draft, setDraft] = useState<Partial<CompanyExtra> | null>(null);

  async function save() {
    if (!draft) return;
    try {
      if (draft.id) {
        await update.mutateAsync({ id: draft.id, input: draft });
        toast.success(t('panel.company.sections.extras.toasts.extraUpdated'));
      } else {
        await create.mutateAsync(draft);
        toast.success(t('panel.company.sections.extras.toasts.extraAdded'));
      }
      setDraft(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.sections.extras.toasts.couldNotSave'));
    }
  }

  async function onDelete(id: number) {
    if (!window.confirm(t('panel.company.sections.extras.confirms.deleteExtra'))) return;
    try {
      await remove.mutateAsync(id);
      toast.success(t('panel.company.sections.extras.toasts.deleted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.sections.extras.toasts.couldNotDelete'));
    }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold">{t('panel.company.nav.extras')}</h1>
        <Button className="bg-gradient-brand text-white border-0" onClick={() => setDraft(blank())}>
          <Plus className="h-4 w-4 mr-1.5" /> {t('panel.company.sections.extras.addExtra')}
        </Button>
      </div>

      {draft && (
        <Card className="p-5">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>{t('panel.common.code')}</Label>
              <select
                value={draft.code ?? 'custom'}
                onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                {EXTRA_CODE_OPTIONS.map((o) => (
                  <option key={o.code} value={o.code}>{t(o.labelKey)}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t('panel.company.sections.extras.displayName')}</Label>
              <Input value={draft.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div>
              <Label>{t('panel.company.sections.extras.chargeMode')}</Label>
              <select
                value={draft.charge_mode ?? 'per_day'}
                onChange={(e) => setDraft({ ...draft, charge_mode: e.target.value as CompanyExtra['charge_mode'] })}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                <option value="per_day">{t('panel.company.sections.extras.chargeModes.perDay')}</option>
                <option value="per_rental">{t('panel.company.sections.extras.chargeModes.perRental')}</option>
                <option value="free">{t('common.free')}</option>
              </select>
            </div>
            <div>
              <Label>{t('panel.company.sections.extras.pricePerDay')}</Label>
              <Input type="number" min={0} value={draft.price_per_day ?? 0} onChange={(e) => setDraft({ ...draft, price_per_day: Number(e.target.value) })} disabled={draft.charge_mode === 'free' || draft.charge_mode === 'per_rental'} />
            </div>
            <div>
              <Label>{t('panel.company.sections.extras.pricePerRental')}</Label>
              <Input type="number" min={0} value={draft.price_per_rental ?? 0} onChange={(e) => setDraft({ ...draft, price_per_rental: Number(e.target.value) })} disabled={draft.charge_mode !== 'per_rental'} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <Switch checked={!!draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} id="extra-active" />
              <Label htmlFor="extra-active">{t('panel.company.sections.extras.activeShownToCustomers')}</Label>
            </div>
            <div className="sm:col-span-2">
              <Label>{t('panel.company.sections.extras.descriptionOptional')}</Label>
              <Textarea rows={2} value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={save} disabled={create.isPending || update.isPending} className="bg-gradient-brand text-white border-0">
              {(create.isPending || update.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {t('common.save')}
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)}>{t('common.cancel')}</Button>
          </div>
        </Card>
      )}

      {extras.isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {!extras.isLoading && items.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          <Sparkles className="h-10 w-10 mx-auto mb-2 opacity-50" />
          {t('panel.company.sections.extras.noExtras')}
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((e) => (
          <Card key={e.id} className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-display font-bold">{e.name}</h3>
                <div className="text-xs text-muted-foreground">{e.code}</div>
              </div>
              <Badge variant={e.is_active ? 'secondary' : 'outline'}>{e.is_active ? t('panel.company.sections.extras.active') : t('panel.company.sections.extras.hidden')}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {e.charge_mode === 'free' && t('common.free')}
              {e.charge_mode === 'per_day' && t('panel.company.sections.extras.pricePerDayFormatted', { amount: e.price_per_day })}
              {e.charge_mode === 'per_rental' && t('panel.company.sections.extras.pricePerRentalFormatted', { amount: e.price_per_rental })}
            </div>
            {e.description && <p className="text-xs text-muted-foreground mt-2">{e.description}</p>}
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => setDraft(e)}>{t('common.edit')}</Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(e.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============== INSURANCE PACKAGES ============== */
const TIER_LABEL_KEYS: Record<InsurancePackage['tier'], string> = {
  mini: 'panel.company.sections.insurance.tierLabels.mini',
  mid: 'panel.company.sections.insurance.tierLabels.mid',
  full: 'panel.company.sections.insurance.tierLabels.full',
};

export function DashInsurance() {
  const { t } = useTranslation();
  const packages = useInsurancePackages();
  const create = useCreateInsurancePackage();
  const update = useUpdateInsurancePackage();
  const remove = useDeleteInsurancePackage();

  const items = packages.data ?? [];

  const [draft, setDraft] = useState<Partial<InsurancePackage> | null>(null);

  function newPackage(): Partial<InsurancePackage> {
    return { tier: 'mini', name: t('booking.insuranceMini'), price_per_day: 0, is_active: true, included_features: [] };
  }

  async function save() {
    if (!draft) return;
    try {
      if (draft.id) {
        await update.mutateAsync({ id: draft.id, input: draft });
        toast.success(t('panel.company.sections.insurance.toasts.packageUpdated'));
      } else {
        await create.mutateAsync(draft);
        toast.success(t('panel.company.sections.insurance.toasts.packageAdded'));
      }
      setDraft(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.sections.insurance.toasts.couldNotSave'));
    }
  }

  async function onDelete(id: number) {
    if (!window.confirm(t('panel.company.sections.insurance.confirms.deletePackage'))) return;
    try {
      await remove.mutateAsync(id);
      toast.success(t('panel.company.sections.insurance.toasts.deleted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('panel.company.sections.insurance.toasts.couldNotDelete'));
    }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold">{t('panel.company.nav.insurance')}</h1>
        <Button className="bg-gradient-brand text-white border-0" onClick={() => setDraft(newPackage())}>
          <Plus className="h-4 w-4 mr-1.5" /> {t('panel.company.sections.insurance.addPackage')}
        </Button>
      </div>

      {draft && (
        <Card className="p-5">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>{t('panel.company.sections.insurance.tier')}</Label>
              <select
                value={draft.tier ?? 'mini'}
                onChange={(e) => setDraft({ ...draft, tier: e.target.value as InsurancePackage['tier'] })}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                disabled={!!draft.id}
              >
                <option value="mini">{t('booking.insuranceMini')}</option>
                <option value="mid">{t('booking.insuranceMid')}</option>
                <option value="full">{t('booking.insuranceFull')}</option>
              </select>
            </div>
            <div>
              <Label>{t('panel.company.sections.insurance.displayName')}</Label>
              <Input value={draft.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div>
              <Label>{t('panel.company.sections.insurance.pricePerDay')}</Label>
              <Input type="number" min={0} value={draft.price_per_day ?? 0} onChange={(e) => setDraft({ ...draft, price_per_day: Number(e.target.value) })} />
            </div>
            <div>
              <Label>{t('panel.company.sections.insurance.deductibleAmount')}</Label>
              <Input type="number" min={0} value={draft.deductible_amount ?? ''} onChange={(e) => setDraft({ ...draft, deductible_amount: e.target.value === '' ? null : Number(e.target.value) })} placeholder={t('panel.company.sections.insurance.deductiblePlaceholder')} />
            </div>
            <div>
              <Label>{t('panel.company.sections.insurance.coverageAmount')}</Label>
              <Input type="number" min={0} value={draft.coverage_amount ?? ''} onChange={(e) => setDraft({ ...draft, coverage_amount: e.target.value === '' ? null : Number(e.target.value) })} placeholder={t('panel.company.sections.insurance.coveragePlaceholder')} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={!!draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} id="ins-active" />
              <Label htmlFor="ins-active">{t('panel.company.sections.insurance.active')}</Label>
            </div>
            <div className="sm:col-span-2">
              <Label>{t('auth.registerCompany.description')}</Label>
              <Textarea rows={3} value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder={t('panel.company.sections.insurance.descriptionPlaceholder')} />
            </div>
            <div className="sm:col-span-2">
              <Label>{t('panel.company.sections.insurance.includedFeatures')}</Label>
              <Textarea rows={3} value={(draft.included_features ?? []).join('\n')} onChange={(e) => setDraft({ ...draft, included_features: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} placeholder={t('panel.company.sections.insurance.includedFeaturesPlaceholder')} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={save} disabled={create.isPending || update.isPending} className="bg-gradient-brand text-white border-0">
              {(create.isPending || update.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {t('common.save')}
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)}>{t('common.cancel')}</Button>
          </div>
        </Card>
      )}

      {packages.isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {!packages.isLoading && items.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          <Shield className="h-10 w-10 mx-auto mb-2 opacity-50" />
          {t('panel.company.sections.insurance.noPackages')}
        </Card>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        {items.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-display font-bold">{p.name}</h3>
                <div className="text-xs text-muted-foreground">{t(TIER_LABEL_KEYS[p.tier])}</div>
              </div>
              <Badge variant={p.is_active ? 'secondary' : 'outline'}>{p.is_active ? t('panel.company.sections.insurance.active') : t('panel.company.sections.insurance.hidden')}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">{t('panel.company.sections.insurance.pricePerDayFormatted', { amount: p.price_per_day })}</div>
            {p.deductible_amount !== null && p.deductible_amount !== undefined && (
              <div className="text-xs text-muted-foreground mt-1">{t('panel.company.sections.insurance.deductibleFormatted', { amount: p.deductible_amount })}</div>
            )}
            {p.coverage_amount !== null && p.coverage_amount !== undefined && (
              <div className="text-xs text-muted-foreground">{t('panel.company.sections.insurance.coverageFormatted', { amount: p.coverage_amount })}</div>
            )}
            {p.included_features.length > 0 && (
              <ul className="text-xs text-muted-foreground mt-2 list-disc list-inside space-y-0.5">
                {p.included_features.slice(0, 4).map((f) => <li key={f}>{f}</li>)}
              </ul>
            )}
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => setDraft(p)}>{t('common.edit')}</Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(p.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
