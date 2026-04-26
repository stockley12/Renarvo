import { Link, NavLink as RRNavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { CurrencySwitcher } from '@/components/common/CurrencySwitcher';
import { useApp } from '@/store/app';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', key: 'nav.home' },
  { to: '/cars', key: 'nav.cars' },
  { to: '/how-it-works', key: 'nav.howItWorks' },
  { to: '/for-companies', key: 'nav.forCompanies' },
];

export function PublicHeader() {
  const { t } = useTranslation();
  const { role } = useApp();
  const dashLink = role === 'admin' ? '/admin' : role === 'company' ? '/dashboard' : '/login';
  const dashLabel = role === 'admin' ? 'nav.admin' : role === 'company' ? 'nav.dashboard' : 'nav.login';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link to="/"><Logo /></Link>
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <RRNavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                  )
                }
              >
                {t(item.key)}
              </RRNavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <div className="hidden md:flex items-center">
            <LanguageSwitcher />
            <CurrencySwitcher />
            <ThemeToggle />
          </div>
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link to={dashLink}><User className="h-4 w-4 mr-1.5" />{t(dashLabel)}</Link>
          </Button>
          <Button asChild size="sm" className="hidden md:inline-flex bg-gradient-brand text-white border-0 hover:opacity-90">
            <Link to="/register-company">{t('nav.register')}</Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-1 mt-8">
                {navItems.map((item) => (
                  <RRNavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn('px-3 py-3 rounded-lg text-sm font-medium', isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted')
                    }
                  >
                    {t(item.key)}
                  </RRNavLink>
                ))}
                <div className="h-px bg-border my-3" />
                <div className="flex items-center gap-2 px-1">
                  <LanguageSwitcher />
                  <CurrencySwitcher />
                  <ThemeToggle />
                </div>
                <Button asChild className="mt-3 bg-gradient-brand text-white border-0">
                  <Link to="/register-company">{t('nav.register')}</Link>
                </Button>
                <Button asChild variant="outline" className="mt-2">
                  <Link to={dashLink}>{t(dashLabel)}</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
