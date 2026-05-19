import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/brand/Logo';
import { toast } from 'sonner';
import { api, login as apiLogin, ApiClientError } from '@/lib/api';
import { useSession } from '@/store/session';

export function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const setUser = useSession((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await apiLogin(email, password);
      setUser(data.user);
      toast.success(t('auth.loggedIn'));
      const next = params.get('next');
      const fallback =
        data.user.role === 'superadmin' ? '/admin' :
        data.user.role === 'company_owner' || data.user.role === 'company_staff' ? '/dashboard' :
        '/';
      const dest = next && next.startsWith('/') ? next : fallback;
      navigate(dest);
    } catch (err) {
      if (err instanceof ApiClientError) toast.error(err.message);
      else toast.error(t('auth.loginFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-10 md:py-16 max-w-md">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> {t('common.back')}
      </Button>
      <Card className="p-6 md:p-8">
        <Logo className="mb-6" />
        <h1 className="font-display text-2xl font-bold mb-2">{t('auth.login')}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t('auth.welcomeBack')}</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-gradient-brand text-white border-0">
            {submitting ? t('auth.signingIn') : t('auth.login')}
          </Button>
          <div className="text-center text-sm">
            <Link to="/forgot-password" className="text-muted-foreground hover:text-primary">
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <div className="text-center text-sm">
            {t('auth.newHere')} <Link to="/register" className="text-primary font-semibold">{t('auth.createAccount')}</Link>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            {t('auth.areYouCompany')} <Link to="/register-company" className="text-primary font-semibold">{t('auth.registerFleet')}</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success(t('auth.resetLinkSent'));
    } catch (err) {
      if (err instanceof ApiClientError) toast.error(err.message);
      else toast.error(t('auth.resetLinkFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-16 max-w-md">
      <Card className="p-8">
        <h1 className="font-display text-2xl font-bold mb-2">{t('auth.resetPassword')}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t('auth.enterEmailForReset')}</p>
        {sent ? (
          <p className="text-sm">{t('auth.resetLinkSentDesc')}</p>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button disabled={submitting} type="submit" className="w-full bg-gradient-brand text-white border-0">
              {submitting ? t('auth.sending') : t('auth.sendLink')}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

export function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pw1 !== pw2) {
      toast.error(t('auth.passwordsNotMatch'));
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    if (!token || !email) {
      toast.error(t('auth.invalidResetLink'));
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, email, password: pw1 });
      toast.success(t('auth.passwordUpdated'));
      navigate('/login');
    } catch (err) {
      if (err instanceof ApiClientError) toast.error(err.message);
      else toast.error(t('auth.resetFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-16 max-w-md">
      <Card className="p-8">
        <h1 className="font-display text-2xl font-bold mb-2">{t('auth.newPassword')}</h1>
        <form className="space-y-4 mt-6" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="pw1">{t('auth.newPassword')}</Label>
            <Input id="pw1" type="password" required minLength={8} value={pw1} onChange={(e) => setPw1(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pw2">{t('auth.confirm')}</Label>
            <Input id="pw2" type="password" required value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
          <Button disabled={submitting} type="submit" className="w-full bg-gradient-brand text-white border-0">
            {submitting ? t('auth.updating') : t('auth.update')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
