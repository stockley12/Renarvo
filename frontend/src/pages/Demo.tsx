import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Building2, Shield, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';
import { useApp, type Role } from '@/store/app';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

const options: { role: Role; icon: any; to: string; gradient: string }[] = [
  { role: 'visitor', icon: User, to: '/', gradient: 'from-brand to-brand-glow' },
  { role: 'company', icon: Building2, to: '/dashboard', gradient: 'from-navy to-brand' },
  { role: 'admin', icon: Shield, to: '/admin', gradient: 'from-navy to-purple-600' },
];

export default function Demo() {
  const { t } = useTranslation();
  const { setRole, role: current } = useApp();
  const navigate = useNavigate();

  const pick = (r: Role, to: string) => {
    setRole(r);
    navigate(to);
  };

  return (
    <div className="min-h-screen bg-gradient-hero text-white flex flex-col">
      <header className="container flex items-center justify-between py-6">
        <Logo variant="light" />
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 container flex flex-col items-center justify-center py-12">
        <div className="text-center max-w-2xl mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-1.5 mb-6 text-sm border border-white/15">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-glow" />
            {t('demo.title')}
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
            {t('demo.subtitle')}
          </h1>
          <p className="text-white/70 text-lg">
            Choose how you want to walk through the Renarvo demo
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 w-full max-w-5xl">
          {options.map(({ role, icon: Icon, to, gradient }) => (
            <Card
              key={role}
              onClick={() => pick(role, to)}
              className={`group cursor-pointer p-8 bg-white/5 backdrop-blur border-white/10 hover:border-white/30 transition-all hover:scale-[1.02] hover:shadow-elevated text-white ${current === role ? 'ring-2 ring-brand-glow' : ''}`}
            >
              <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-elevated`}>
                <Icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-2">{t(`demo.${role}`)}</h3>
              <p className="text-white/60 text-sm mb-6">{t(`demo.${role}Desc`)}</p>
              <Button variant="ghost" className="text-white hover:bg-white/10 -ml-3 group-hover:translate-x-1 transition-transform">
                Enter <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>

        <p className="mt-12 text-white/50 text-sm text-center max-w-md">
          Frontend demo — no real authentication. Your role is saved in this browser only and you can switch any time from the floating pill.
        </p>
      </main>
    </div>
  );
}
