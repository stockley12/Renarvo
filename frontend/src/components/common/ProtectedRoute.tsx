import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '@/store/session';
import type { ApiUser } from '@/lib/api';

type Role = ApiUser['role'];

interface ProtectedRouteProps {
  /** Roles allowed to access the wrapped routes. */
  allow: Role[];
}

export function ProtectedRoute({ allow }: ProtectedRouteProps) {
  const user = useSession((s) => s.user);
  const loading = useSession((s) => s.loading);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (!allow.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-muted/30 px-6 text-center">
        <div className="text-3xl font-display font-bold">403</div>
        <p className="text-sm text-muted-foreground max-w-md">
          You don't have permission to view this area. Try signing in with an
          authorised account.
        </p>
        <Navigate
          to={user.role === 'superadmin' ? '/admin' : user.role === 'customer' ? '/' : '/dashboard'}
          replace
        />
      </div>
    );
  }

  return <Outlet />;
}
