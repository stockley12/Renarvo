import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
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
      toast.success('Logged in');
      const next = params.get('next');
      const fallback =
        data.user.role === 'superadmin' ? '/admin' :
        data.user.role === 'company_owner' || data.user.role === 'company_staff' ? '/dashboard' :
        '/';
      const dest = next && next.startsWith('/') ? next : fallback;
      navigate(dest);
    } catch (err) {
      if (err instanceof ApiClientError) toast.error(err.message);
      else toast.error('Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-16 max-w-md">
      <Card className="p-8">
        <Logo className="mb-6" />
        <h1 className="font-display text-2xl font-bold mb-2">Log in</h1>
        <p className="text-sm text-muted-foreground mb-6">Welcome back to Renarvo</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="email">Email</Label>
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
            <Label htmlFor="password">Password</Label>
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
            {submitting ? 'Signing in…' : 'Log in'}
          </Button>
          <div className="text-center text-sm">
            <Link to="/forgot-password" className="text-muted-foreground hover:text-primary">
              Forgot password?
            </Link>
          </div>
          <div className="text-center text-sm">
            New here? <Link to="/register" className="text-primary font-semibold">Create an account</Link>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            Are you a rental company? <Link to="/register-company" className="text-primary font-semibold">Register your fleet</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent (check your email)');
    } catch (err) {
      if (err instanceof ApiClientError) toast.error(err.message);
      else toast.error('Failed to send reset link');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-16 max-w-md">
      <Card className="p-8">
        <h1 className="font-display text-2xl font-bold mb-2">Reset password</h1>
        <p className="text-sm text-muted-foreground mb-6">Enter your email to receive a reset link</p>
        {sent ? (
          <p className="text-sm">If the email is registered, you'll receive a reset link within a minute.</p>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button disabled={submitting} type="submit" className="w-full bg-gradient-brand text-white border-0">
              {submitting ? 'Sending…' : 'Send link'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

export function ResetPassword() {
  const navigate = useNavigate();
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pw1 !== pw2) {
      toast.error('Passwords do not match');
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    if (!token || !email) {
      toast.error('Invalid reset link');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, email, password: pw1 });
      toast.success('Password updated');
      navigate('/login');
    } catch (err) {
      if (err instanceof ApiClientError) toast.error(err.message);
      else toast.error('Reset failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-16 max-w-md">
      <Card className="p-8">
        <h1 className="font-display text-2xl font-bold mb-2">New password</h1>
        <form className="space-y-4 mt-6" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="pw1">New password</Label>
            <Input id="pw1" type="password" required minLength={8} value={pw1} onChange={(e) => setPw1(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pw2">Confirm</Label>
            <Input id="pw2" type="password" required value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
          <Button disabled={submitting} type="submit" className="w-full bg-gradient-brand text-white border-0">
            {submitting ? 'Updating…' : 'Update'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
