import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
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
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (!accept) {
      toast.error('Please accept the terms to continue');
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
      toast.success('Welcome to Renarvo');
      const next = params.get('next');
      navigate(next && next.startsWith('/') ? next : '/');
    } catch (err) {
      if (err instanceof ApiClientError) toast.error(err.message);
      else toast.error('Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-10 md:py-16 max-w-md">
      <Card className="p-6 md:p-8">
        <Logo className="mb-6" />
        <h1 className="font-display text-2xl font-bold mb-2">Create your account</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Book cars across North Cyprus in a few clicks.
        </p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              autoComplete="name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
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
            <Label htmlFor="phone">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+90 533 123 45 67"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm password</Label>
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
              I agree to the <Link to="/terms" className="text-primary hover:underline">Terms</Link> and{' '}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </span>
          </label>
          <Button type="submit" disabled={submitting} className="w-full bg-gradient-brand text-white border-0">
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
          <div className="text-center text-sm">
            Already have an account? <Link to="/login" className="text-primary font-semibold">Log in</Link>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            Are you a rental company? <Link to="/register-company" className="text-primary font-semibold">Register your fleet</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
