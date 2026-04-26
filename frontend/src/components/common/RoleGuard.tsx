import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp, type Role } from '@/store/app';

interface Props { allowed: Role[]; }

export function RoleGuard({ allowed }: Props) {
  const { role } = useApp();
  const location = useLocation();
  if (!allowed.includes(role)) {
    return <Navigate to="/demo" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
