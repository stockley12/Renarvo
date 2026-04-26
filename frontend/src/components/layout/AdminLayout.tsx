import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield, LayoutDashboard, Building2, ClipboardCheck, Car, CalendarRange,
  Users, Star, FileText, BadgeDollarSign, Settings, Search, Bell,
  ShieldAlert, Activity, FileSearch, Megaphone, Sparkles,
} from 'lucide-react';
import { useSession } from '@/store/session';
import { logout as apiLogout } from '@/lib/api';
import { toast } from 'sonner';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/brand/Logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { DemoPill } from '@/components/common/DemoPill';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type NavItem = { to: string; icon: any; label: string; end?: boolean; badge?: string | number };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/admin/system', icon: Activity, label: 'System health' },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { to: '/admin/companies', icon: Building2, label: 'Companies' },
      { to: '/admin/approvals', icon: ClipboardCheck, label: 'Approvals', badge: 3 },
      { to: '/admin/catalog', icon: Car, label: 'Catalog' },
      { to: '/admin/reservations', icon: CalendarRange, label: 'Reservations' },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/admin/users', icon: Users, label: 'Users' },
      { to: '/admin/reviews', icon: Star, label: 'Reviews' },
    ],
  },
  {
    label: 'Trust & Safety',
    items: [
      { to: '/admin/risk', icon: ShieldAlert, label: 'Risk & fraud', badge: 7 },
      { to: '/admin/audit', icon: FileSearch, label: 'Audit log' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/admin/finance', icon: BadgeDollarSign, label: 'Finance' },
      { to: '/admin/notifications', icon: Megaphone, label: 'Broadcast' },
      { to: '/admin/content', icon: FileText, label: 'Content' },
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const isItemActive = (to: string, end?: boolean) =>
    end ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + '/');
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="px-3 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Logo showWordmark={!collapsed} />
          {!collapsed && (
            <Badge variant="outline" className="border-brand/50 text-brand text-[10px] font-bold">
              ADMIN
            </Badge>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0 py-3 px-2">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="py-1.5">
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/60 px-2 mb-1">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const isAlert = typeof item.badge === 'number' && item.badge > 5;
                  const active = isItemActive(item.to, item.end);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        tooltip={collapsed ? item.label : undefined}
                        className="h-10 p-0 hover:bg-transparent data-[active=true]:bg-transparent"
                      >
                        <NavLink
                          to={item.to}
                          end={item.end}
                          className={cn(
                            'group relative flex items-center gap-3 w-full rounded-xl px-2.5 py-2 transition-all duration-200',
                            active
                              ? 'bg-gradient-to-r from-primary to-brand-glow text-white shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.5)] font-semibold hover:text-white'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          )}
                        >
                          {active && !collapsed && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-white/80" />
                          )}
                          <span
                            className={cn(
                              'flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-colors',
                              active ? 'bg-white/15' : 'bg-transparent group-hover:bg-background/60'
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                          </span>
                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate text-sm">{item.label}</span>
                              {item.badge != null && (
                                <Badge
                                  className={cn(
                                    'h-5 px-1.5 text-[10px] font-bold border-0',
                                    active
                                      ? 'bg-white/25 text-white hover:bg-white/25'
                                      : isAlert
                                        ? 'bg-destructive/15 text-destructive hover:bg-destructive/15'
                                        : 'bg-primary/10 text-primary hover:bg-primary/10'
                                  )}
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      {!collapsed && (
        <SidebarFooter className="border-t border-border/60 p-3">
          <div className="rounded-xl bg-muted/40 p-3 border border-border/60">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              <span className="text-xs font-semibold">AI insights</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug mb-2">3 anomalies detected this week.</p>
            <Button size="sm" variant="outline" className="w-full h-7 text-xs">Review</Button>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const setUser = useSession((s) => s.setUser);
  const segments = location.pathname.split('/').filter(Boolean);
  const title = segments[1] ? segments[1].replace(/-/g, ' ') : 'Dashboard';
  const initials = (user?.name ?? 'SA').split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase() || 'SA';

  async function handleSignOut() {
    try { await apiLogout(); } catch { /* ignore */ }
    setUser(null);
    toast.success('Signed out');
    navigate('/login');
  }

  return (
    <header className="h-14 md:h-16 border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-30 flex items-center gap-2 md:gap-3 px-3 md:px-4">
      <SidebarTrigger />
      <div className="hidden md:flex items-center gap-2">
        <Shield className="h-4 w-4 text-brand" />
        <div className="flex flex-col leading-tight">
          <span className="text-[11px] text-muted-foreground">Super admin</span>
          <span className="font-display font-semibold text-base capitalize">{title}</span>
        </div>
      </div>
      <div className="flex-1 max-w-md mx-auto hidden sm:block">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search platform — companies, users, reservations…" className="pl-9 h-9 bg-muted/50 border-border/60 rounded-full" />
          <kbd className="hidden lg:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">⌘K</kbd>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-0.5 md:gap-1">
        <div className="hidden sm:flex"><LanguageSwitcher /></div>
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account">
              <Avatar className="h-8 w-8"><AvatarFallback className="bg-navy text-white text-xs">{initials}</AvatarFallback></Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-semibold truncate">{user?.name ?? 'Super Admin'}</div>
              <div className="text-xs text-muted-foreground font-normal truncate">{user?.email ?? 'Platform owner'}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><NavLink to="/admin/settings">Settings</NavLink></DropdownMenuItem>
            <DropdownMenuItem asChild><NavLink to="/admin/audit">Audit log</NavLink></DropdownMenuItem>
            <DropdownMenuItem asChild><NavLink to="/">Public site</NavLink></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onSelect={handleSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-3 sm:p-4 md:p-6 animate-fade-in"><Outlet /></main>
        </div>
        <DemoPill />
      </div>
    </SidebarProvider>
  );
}
