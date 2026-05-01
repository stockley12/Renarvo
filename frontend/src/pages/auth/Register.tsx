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
import { register as apiRegister, ApiClientError } from '@/lib/api';
import { useSession } from '@/store/session';
import { useApp } from '@/store/app';

export default function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setUser = useSession((s) => s.setUser);
  const { locale } = useApp();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accept, setAccept] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error(t('auth.register.passwordTooShort'));
      return;
    }
    if (password !== confirm) {
      toast.error(t('auth.register.passwordMismatch'));
      return;
    }
    if (!accept) {
      toast.error(t('auth.register.mustAcceptTerms'));
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiRegister({
        email,
        password,
        name,
        phone: phone || undefined,
        locale,
      });
      setUser(data.user);
      toast.success(t('auth.register.welcome'));
      const next = params.get('next');
      navigate(next && next.startsWith('/') ? next : '/');
    } catch (err) {
      if (err instanceof ApiClientError) toast.error(err.message);
      else toast.error(t('auth.register.failed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-10 md:py-16 max-w-md">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> {t('auth.register.back')}
      </Button>
      <Card className="p-6 md:p-8">
        <Logo className="mb-6" />
        <h1 className="font-display text-2xl font-bold mb-2">{t('auth.register.title')}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {t('auth.register.subtitle')}
        </p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="name">{t('auth.register.name')}</Label>
            <Input
              id="name"
              autoComplete="name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('auth.register.namePh')}
            />
          </div>
          <div>
            <Label htmlFor="email">{t('auth.register.email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.register.emailPh')}
            />
          </div>
          <div>
            <Label htmlFor="phone">
              {t('auth.register.phone')}{' '}
              <span className="text-muted-foreground font-normal">{t('auth.register.phoneOptional')}</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('auth.register.phonePh')}
            />
          </div>
          <div>
            <Label htmlFor="password">{t('auth.register.password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.register.passwordPh')}
            />
          </div>
          <div>
            <Label htmlFor="confirm">{t('auth.register.confirmPassword')}</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={accept}
              onChange={(e) => setAccept(e.target.checked)}
            />
            <span>
              {t('auth.register.agreeTo')}{' '}
              <Link to="/terms" className="text-primary hover:underline">{t('auth.register.termsLink')}</Link>{' / '}
              <Link to="/privacy" className="text-primary hover:underline">{t('auth.register.privacyLink')}</Link>.
            </span>
          </label>
          <Button type="submit" disabled={submitting} className="w-full bg-gradient-brand text-white border-0">
            {submitting ? t('auth.register.submitting') : t('auth.register.submit')}
          </Button>
          <div className="text-center text-sm">
            {t('auth.register.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-primary font-semibold">{t('auth.register.logIn')}</Link>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            {t('auth.register.areYouCompany')}{' '}
            <Link to="/register-company" className="text-primary font-semibold">{t('auth.register.registerYourFleet')}</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
