import { useEffect, useState } from 'react';
import { Link, NavLink as RRNavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, LogIn, Menu, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { CurrencySwitcher } from '@/components/common/CurrencySwitcher';
import { useSession } from '@/store/session';
import { logout as apiLogout } from '@/lib/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', key: 'nav.home' },
  { to: '/how-it-works', key: 'nav.howItWorks' },
  { to: '/for-companies', key: 'nav.forCompanies' },
];

const carCategories: { id: string; key: string }[] = [
  { id: '', key: 'nav.categories.all' },
  { id: 'economy', key: 'nav.categories.economy' },
  { id: 'compact', key: 'nav.categories.compact' },
  { id: 'comfort', key: 'nav.categories.comfort' },
  { id: 'prestige', key: 'nav.categories.prestige' },
  { id: 'premium', key: 'nav.categories.premium' },
  { id: 'luxury', key: 'nav.categories.luxury' },
  { id: 'suv', key: 'nav.categories.suv' },
  { id: 'minivan', key: 'nav.categories.minivan' },
  { id: 'van', key: 'nav.categories.van' },
  { id: 'electric', key: 'nav.categories.electric' },
];

function initialsOf(name?: string | null) {
  if (!name) return 'U';
  return name.split(/\s+/).filter(Boolean).map((s) => s[0]).slice(0, 2).join('').toUpperCase() || 'U';
}

export function PublicHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const setUser = useSession((s) => s.setUser);

  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => { setMobileOpen(false); }, [location.pathname, location.search]);

  async function handleSignOut() {
    try { await apiLogout(); } catch { /* ignore */ }
    setUser(null);
    toast.success(t('auth.signedOut'));
    navigate('/');
  }

  const role = user?.role;
  const dashHref =
    role === 'superadmin' ? '/admin' :
    role === 'company_owner' || role === 'company_staff' ? '/dashboard' :
    null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link to="/"><Logo /></Link>
          <nav className="hidden lg:flex items-center gap-1">
            <RRNavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'text-primary bg-primary/10' : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                )
              }
            >
              {t('nav.home')}
            </RRNavLink>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === '/cars' || location.pathname.startsWith('/cars?')
                      ? 'text-primary bg-primary/10'
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                  )}
                >
                  {t('nav.cars')} <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {carCategories.map((c) => (
                  <DropdownMenuItem key={c.key} asChild>
                    <Link to={c.id ? `/cars?category=${c.id}` : '/cars'}>{t(c.key)}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {navItems.slice(1).map((item) => (
              <RRNavLink
                key={item.to}
                to={item.to}
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

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden md:inline-flex gap-2 pl-1.5 pr-3">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-gradient-brand text-white text-[11px]">
                      {initialsOf(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium max-w-[120px] truncate">{user.name?.split(' ')[0] ?? 'Account'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-semibold truncate">{user.name}</div>
                  <div className="text-xs text-muted-foreground font-normal truncate">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {dashHref ? (
                  <DropdownMenuItem asChild><Link to={dashHref}>{role === 'superadmin' ? t('nav.adminPanel') : t('nav.dashboard')}</Link></DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem asChild><Link to="/me/reservations">{t('nav.myReservations')}</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/cars">{t('nav.browseCars')}</Link></DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem asChild><Link to="/help">{t('nav.help')}</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onSelect={handleSignOut}>{t('nav.signOut')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <Link to="/login"><LogIn className="h-4 w-4 mr-1.5" />{t('nav.login')}</Link>
              </Button>
                <Button asChild size="sm" className="hidden md:inline-flex bg-gradient-brand text-white border-0 hover:opacity-90">
                <Link to="/register"><UserIcon className="h-4 w-4 mr-1.5" />{t('nav.signUp')}</Link>
              </Button>
            </>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm overflow-y-auto">
              <div className="flex flex-col gap-1 mt-8">
                <RRNavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    cn('px-3 py-3 rounded-lg text-sm font-medium', isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted')
                  }
                >
                  {t('nav.home')}
                </RRNavLink>
                <details className="group">
                  <summary className="cursor-pointer list-none px-3 py-3 rounded-lg text-sm font-medium hover:bg-muted flex items-center justify-between">
                    <span>{t('nav.cars')}</span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="ml-3 mt-1 mb-2 border-l border-border/60 pl-3 flex flex-col gap-0.5">
                    {carCategories.map((c) => (
                      <Link
                        key={c.key}
                        to={c.id ? `/cars?category=${c.id}` : '/cars'}
                        className="px-3 py-2 rounded-lg text-sm text-foreground/80 hover:bg-muted"
                      >
                        {t(c.key)}
                      </Link>
                    ))}
                  </div>
                </details>
                {navItems.slice(1).map((item) => (
                  <RRNavLink
                    key={item.to}
                    to={item.to}
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

                {user ? (
                  <>
                    <div className="px-3 py-2 mt-3 rounded-lg bg-muted/40 border border-border/60">
                      <div className="text-sm font-semibold truncate">{user.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    </div>
                    {dashHref && (
                      <Button asChild variant="outline" className="mt-2">
                        <Link to={dashHref}>{role === 'superadmin' ? t('nav.adminPanel') : t('nav.dashboard')}</Link>
                      </Button>
                    )}
                    <Button variant="outline" className="mt-2" onClick={handleSignOut}>{t('nav.signOut')}</Button>
                  </>
                ) : (
                  <>
                    <Button asChild className="mt-3 bg-gradient-brand text-white border-0">
                      <Link to="/register">{t('nav.signUp')}</Link>
                    </Button>
                    <Button asChild variant="outline" className="mt-2">
                      <Link to="/login">{t('nav.login')}</Link>
                    </Button>
                    <Button asChild variant="ghost" className="mt-2 text-xs">
                      <Link to="/register-company">{t('home.listFleet')}</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
