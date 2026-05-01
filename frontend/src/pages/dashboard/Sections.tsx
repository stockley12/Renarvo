import { useState } from 'react';
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
  const { currency, locale } = useApp();
  const [q, setQ] = useState('');
  const customers = useCompanyCustomers({ search: q || undefined, limit: 100 });
  const items = customers.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">Customers</h1>
      </div>
      <Card className="p-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-9 border-0 bg-transparent"
          />
        </div>
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Bookings</th>
              <th className="px-4 py-3 font-medium text-right">Total spent</th>
              <th className="px-4 py-3 font-medium">Last booking</th>
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
                  No customers yet
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
      toast.error('Name and address required');
      return;
    }
    try {
      await create.mutateAsync({ name, address, city: city || null, latitude: null, longitude: null, opening_hours: null });
      toast.success('Branch added');
      setCreating(false);
      setName('');
      setAddress('');
      setCity('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add branch');
    }
  }

  async function onDelete(id: number) {
    if (!window.confirm('Delete this branch?')) return;
    try {
      await remove.mutateAsync(id);
      toast.success('Branch deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete');
    }
  }

  const items = branches.data ?? [];

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold">Branches & locations</h1>
        <Button className="bg-gradient-brand text-white border-0" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add branch
        </Button>
      </div>

      {creating && (
        <Card className="p-5">
          <form onSubmit={onCreate} className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ercan Airport office" />
            </div>
            <div>
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lefkoşa" />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ercan Airport, arrivals" />
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <Button type="submit" disabled={create.isPending} className="bg-gradient-brand text-white border-0">
                {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
              </Button>
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                Cancel
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
          No branches yet. Add your first pickup location.
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
      toast.error('Name and email required');
      return;
    }
    try {
      await invite.mutateAsync({ name, email, role });
      toast.success(`${name} added — they'll receive a password reset email when SMTP is configured.`);
      setInviting(false);
      setName('');
      setEmail('');
      setRole('agent');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not invite staff');
    }
  }

  async function onRemove(id: number) {
    if (!window.confirm('Remove this staff member?')) return;
    try {
      await remove.mutateAsync(id);
      toast.success('Staff member removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove');
    }
  }

  const items = staff.data ?? [];

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold">Staff</h1>
        <Button className="bg-gradient-brand text-white border-0" onClick={() => setInviting(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Invite member
        </Button>
      </div>

      {inviting && (
        <Card className="p-5">
          <form onSubmit={onInvite} className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Role</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'manager' | 'agent')}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                <option value="manager">Manager</option>
                <option value="agent">Agent</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <Button type="submit" disabled={invite.isPending} className="bg-gradient-brand text-white border-0">
                {invite.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Send invite
              </Button>
              <Button type="button" variant="outline" onClick={() => setInviting(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
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
                  No staff yet
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
  const reviews = useCompanyReviews();
  const reply = useReplyReview();
  const [replying, setReplying] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  async function onReply(id: number) {
    if (!replyText.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }
    try {
      await reply.mutateAsync({ id, text: replyText });
      toast.success('Reply posted');
      setReplying(null);
      setReplyText('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not post reply');
    }
  }

  const items = reviews.data?.data ?? [];

  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="font-display text-3xl font-extrabold">Reviews</h1>
      {reviews.isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {!reviews.isLoading && items.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          No reviews yet — they'll show up after customers complete their bookings.
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
                    <span className="font-semibold">{r.customer?.name ?? 'Guest'}</span>
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
                      <div className="font-semibold text-xs text-primary mb-1">Your reply</div>
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
                    Reply
                  </Button>
                )}
              </div>
              {replying === r.id && (
                <div className="mt-4 space-y-2">
                  <Textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response..."
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => onReply(r.id)} disabled={reply.isPending} className="bg-gradient-brand text-white border-0">
                      Post reply
                    </Button>
                    <Button variant="ghost" onClick={() => setReplying(null)}>
                      Cancel
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
      toast.error('IBAN and holder name required');
      return;
    }
    try {
      await updateBank.mutateAsync({ iban, account_holder: holder, bank_name: bankName || undefined });
      toast.success('Bank account saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save bank account');
    }
  }

  const ps = payouts.data?.payouts ?? [];

  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="font-display text-3xl font-extrabold">Payouts</h1>
      <Card className="p-6">
        <h3 className="font-display font-bold mb-4">Bank account</h3>
        <form onSubmit={onSaveBank} className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>IBAN</Label>
            <Input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="TR00 0000 0000 0000 0000 0000 00" />
          </div>
          <div>
            <Label>Account holder</Label>
            <Input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Company Ltd" />
          </div>
          <div className="sm:col-span-2">
            <Label>Bank (optional)</Label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="İş Bankası" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={updateBank.isPending} className="bg-gradient-brand text-white border-0">
              {updateBank.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save bank info
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-5 border-b font-display font-bold">Payout history</div>
        {payouts.isLoading ? (
          <div className="py-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : ps.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No payouts yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {ps.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">{p.period}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="capitalize">
                      {p.status}
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
  { value: 'trade_registry', label: 'Trade registry' },
  { value: 'tax_certificate', label: 'Tax certificate' },
  { value: 'operating_license', label: 'Operating license' },
  { value: 'insurance', label: 'Insurance certificate' },
] as const;

export function DashDocuments() {
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
      toast.error('Pick a file first');
      return;
    }
    setUploading(true);
    try {
      await uploadCompanyDocument({ type, file, expires_at: expires || null });
      toast.success('Document uploaded — admin will review it');
      setFile(null);
      setExpires('');
      qc.invalidateQueries({ queryKey: ['company', 'documents'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const items = docs.data ?? [];

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="font-display text-3xl font-extrabold">Documents</h1>

      <Card className="p-5">
        <h3 className="font-display font-bold mb-4">Upload new document</h3>
        <form onSubmit={onUpload} className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                {docTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Expires (optional)</Label>
              <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
            </div>
            <div>
              <Label>File (PDF/JPG/PNG, max 10 MB)</Label>
              <Input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <Button type="submit" disabled={uploading} className="bg-gradient-brand text-white border-0">
            {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Upload
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
          No documents uploaded yet.
        </Card>
      )}
      {items.map((d) => {
        const expiring = d.expires_at && new Date(d.expires_at) < new Date(Date.now() + 30 * 86400_000);
        const label = docTypes.find((t) => t.value === d.type)?.label ?? d.type;
        return (
          <Card key={d.id} className="p-5 flex items-center gap-4">
            <FileText className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <div className="font-semibold">{label}</div>
              <div className="text-xs text-muted-foreground">
                {d.expires_at ? `Expires ${formatDate(d.expires_at, locale)}` : 'No expiry'}
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
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    }
  }

  if (settings.isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-6 w-6 mr-2 animate-spin" /> Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="font-display text-3xl font-extrabold">Settings</h1>
      <form onSubmit={onSave} className="space-y-5">
        <Card className="p-6 space-y-4">
          <h3 className="font-display font-bold">Company profile</h3>
          <div>
            <Label>Company name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <Label>Phone (internal)</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <Label>Languages spoken</Label>
            <Input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="Türkçe, English, Русский" />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-display font-bold">Rental policy</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>Minimum rental days</Label>
              <Input type="number" min={1} max={30} value={minRentalDays} onChange={(e) => setMinRentalDays(Number(e.target.value) || 1)} />
            </div>
            <div>
              <Label>Minimum driver age</Label>
              <Input type="number" min={18} max={99} value={minAge} onChange={(e) => setMinAge(Number(e.target.value) || 21)} />
            </div>
            <div>
              <Label>Kilometre policy</Label>
              <select
                value={kmPolicy}
                onChange={(e) => setKmPolicy(e.target.value as typeof kmPolicy)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                <option value="unlimited">Unlimited</option>
                <option value="per_day_limit">Per-day limit</option>
                <option value="total_limit">Total limit</option>
              </select>
            </div>
          </div>
          {kmPolicy !== 'unlimited' && (
            <div>
              <Label>Kilometre limit per day (km)</Label>
              <Input type="number" min={50} max={5000} value={kmLimit} onChange={(e) => setKmLimit(e.target.value === '' ? '' : Number(e.target.value))} placeholder="200" />
            </div>
          )}
          <div className="flex items-center justify-between border-t pt-3">
            <div>
              <div className="font-semibold text-sm">Student-friendly</div>
              <div className="text-xs text-muted-foreground">Allow drivers younger than the standard minimum if they're enrolled students.</div>
            </div>
            <Switch checked={studentFriendly} onCheckedChange={setStudentFriendly} />
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <div>
              <div className="font-semibold text-sm">24/7 roadside assistance</div>
              <div className="text-xs text-muted-foreground">Show a 24/7 support badge on every car.</div>
            </div>
            <Switch checked={roadside247} onCheckedChange={setRoadside247} />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-display font-bold">Public contact & social</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Public email</Label>
              <Input type="email" value={emailPublic} onChange={(e) => setEmailPublic(e.target.value)} placeholder="info@yourcompany.com" />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+90 533 ..." />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@yourcompany" />
            </div>
            <div>
              <Label>Facebook</Label>
              <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="facebook.com/yourcompany" />
            </div>
            <div className="sm:col-span-2">
              <Label>Website</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" />
            </div>
          </div>
        </Card>

        <Separator className="my-2" />
        <Button type="submit" disabled={update.isPending} className="bg-gradient-brand text-white border-0">
          {update.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save changes
        </Button>
      </form>
    </div>
  );
}

/* ============== EXTRAS CATALOG ============== */
const EXTRA_CODE_OPTIONS: { code: string; label: string }[] = [
  { code: 'gps', label: 'GPS' },
  { code: 'child_seat', label: 'Child seat' },
  { code: 'baby_seat', label: 'Baby seat' },
  { code: 'additional_driver', label: 'Additional driver' },
  { code: 'wifi', label: 'Mobile WiFi' },
  { code: 'border_crossing', label: 'Border crossing' },
  { code: 'custom', label: 'Custom' },
];

export function DashExtras() {
  const extras = useCompanyExtras();
  const create = useCreateCompanyExtra();
  const update = useUpdateCompanyExtra();
  const remove = useDeleteCompanyExtra();

  const items = extras.data ?? [];

  function blank(): Partial<CompanyExtra> {
    return {
      code: 'gps',
      name: 'GPS Navigation',
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
        toast.success('Extra updated');
      } else {
        await create.mutateAsync(draft);
        toast.success('Extra added');
      }
      setDraft(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    }
  }

  async function onDelete(id: number) {
    if (!window.confirm('Delete this extra?')) return;
    try {
      await remove.mutateAsync(id);
      toast.success('Deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete');
    }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold">Extras catalog</h1>
        <Button className="bg-gradient-brand text-white border-0" onClick={() => setDraft(blank())}>
          <Plus className="h-4 w-4 mr-1.5" /> Add extra
        </Button>
      </div>

      {draft && (
        <Card className="p-5">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Code</Label>
              <select
                value={draft.code ?? 'custom'}
                onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                {EXTRA_CODE_OPTIONS.map((o) => (
                  <option key={o.code} value={o.code}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Display name</Label>
              <Input value={draft.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div>
              <Label>Charge mode</Label>
              <select
                value={draft.charge_mode ?? 'per_day'}
                onChange={(e) => setDraft({ ...draft, charge_mode: e.target.value as CompanyExtra['charge_mode'] })}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                <option value="per_day">Per day</option>
                <option value="per_rental">Per rental</option>
                <option value="free">Free</option>
              </select>
            </div>
            <div>
              <Label>Price per day (TRY)</Label>
              <Input type="number" min={0} value={draft.price_per_day ?? 0} onChange={(e) => setDraft({ ...draft, price_per_day: Number(e.target.value) })} disabled={draft.charge_mode === 'free' || draft.charge_mode === 'per_rental'} />
            </div>
            <div>
              <Label>Price per rental (TRY)</Label>
              <Input type="number" min={0} value={draft.price_per_rental ?? 0} onChange={(e) => setDraft({ ...draft, price_per_rental: Number(e.target.value) })} disabled={draft.charge_mode !== 'per_rental'} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <Switch checked={!!draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} id="extra-active" />
              <Label htmlFor="extra-active">Active (shown to customers)</Label>
            </div>
            <div className="sm:col-span-2">
              <Label>Description (optional)</Label>
              <Textarea rows={2} value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={save} disabled={create.isPending || update.isPending} className="bg-gradient-brand text-white border-0">
              {(create.isPending || update.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
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
          No extras yet. Add at least GPS, Child seat and Additional driver so customers can pick them at booking.
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
              <Badge variant={e.is_active ? 'secondary' : 'outline'}>{e.is_active ? 'Active' : 'Hidden'}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {e.charge_mode === 'free' && 'Free'}
              {e.charge_mode === 'per_day' && `₺${e.price_per_day} / day`}
              {e.charge_mode === 'per_rental' && `₺${e.price_per_rental} / rental`}
            </div>
            {e.description && <p className="text-xs text-muted-foreground mt-2">{e.description}</p>}
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => setDraft(e)}>Edit</Button>
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
const TIER_LABELS: Record<InsurancePackage['tier'], string> = {
  mini: 'Mini Güvence (Mini)',
  mid: 'Orta Güvence (Mid)',
  full: 'Full Güvence (Full)',
};

export function DashInsurance() {
  const packages = useInsurancePackages();
  const create = useCreateInsurancePackage();
  const update = useUpdateInsurancePackage();
  const remove = useDeleteInsurancePackage();

  const items = packages.data ?? [];

  const [draft, setDraft] = useState<Partial<InsurancePackage> | null>(null);

  function newPackage(): Partial<InsurancePackage> {
    return { tier: 'mini', name: 'Mini Güvence', price_per_day: 0, is_active: true, included_features: [] };
  }

  async function save() {
    if (!draft) return;
    try {
      if (draft.id) {
        await update.mutateAsync({ id: draft.id, input: draft });
        toast.success('Package updated');
      } else {
        await create.mutateAsync(draft);
        toast.success('Package added');
      }
      setDraft(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    }
  }

  async function onDelete(id: number) {
    if (!window.confirm('Delete this package?')) return;
    try {
      await remove.mutateAsync(id);
      toast.success('Deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete');
    }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold">Insurance packages</h1>
        <Button className="bg-gradient-brand text-white border-0" onClick={() => setDraft(newPackage())}>
          <Plus className="h-4 w-4 mr-1.5" /> Add package
        </Button>
      </div>

      {draft && (
        <Card className="p-5">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Tier</Label>
              <select
                value={draft.tier ?? 'mini'}
                onChange={(e) => setDraft({ ...draft, tier: e.target.value as InsurancePackage['tier'] })}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                disabled={!!draft.id}
              >
                <option value="mini">Mini Güvence</option>
                <option value="mid">Orta Güvence</option>
                <option value="full">Full Güvence</option>
              </select>
            </div>
            <div>
              <Label>Display name</Label>
              <Input value={draft.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div>
              <Label>Price per day (TRY)</Label>
              <Input type="number" min={0} value={draft.price_per_day ?? 0} onChange={(e) => setDraft({ ...draft, price_per_day: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Deductible amount (TRY)</Label>
              <Input type="number" min={0} value={draft.deductible_amount ?? ''} onChange={(e) => setDraft({ ...draft, deductible_amount: e.target.value === '' ? null : Number(e.target.value) })} placeholder="e.g. 5000" />
            </div>
            <div>
              <Label>Coverage amount (TRY)</Label>
              <Input type="number" min={0} value={draft.coverage_amount ?? ''} onChange={(e) => setDraft({ ...draft, coverage_amount: e.target.value === '' ? null : Number(e.target.value) })} placeholder="e.g. 200000" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={!!draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} id="ins-active" />
              <Label htmlFor="ins-active">Active</Label>
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea rows={3} value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="What is and isn't covered…" />
            </div>
            <div className="sm:col-span-2">
              <Label>Included features (one per line)</Label>
              <Textarea rows={3} value={(draft.included_features ?? []).join('\n')} onChange={(e) => setDraft({ ...draft, included_features: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} placeholder={'Theft\nThird party liability\nGlass damage'} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={save} disabled={create.isPending || update.isPending} className="bg-gradient-brand text-white border-0">
              {(create.isPending || update.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
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
          No insurance packages yet. Add Mini, Orta and Full so customers can choose at booking.
        </Card>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        {items.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-display font-bold">{p.name}</h3>
                <div className="text-xs text-muted-foreground">{TIER_LABELS[p.tier]}</div>
              </div>
              <Badge variant={p.is_active ? 'secondary' : 'outline'}>{p.is_active ? 'Active' : 'Hidden'}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">₺{p.price_per_day} / day</div>
            {p.deductible_amount !== null && p.deductible_amount !== undefined && (
              <div className="text-xs text-muted-foreground mt-1">Deductible: ₺{p.deductible_amount}</div>
            )}
            {p.coverage_amount !== null && p.coverage_amount !== undefined && (
              <div className="text-xs text-muted-foreground">Coverage: ₺{p.coverage_amount}</div>
            )}
            {p.included_features.length > 0 && (
              <ul className="text-xs text-muted-foreground mt-2 list-disc list-inside space-y-0.5">
                {p.included_features.slice(0, 4).map((f) => <li key={f}>{f}</li>)}
              </ul>
            )}
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => setDraft(p)}>Edit</Button>
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
