import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/user';

export function RequireAuth({
  children,
  role,
  allowedRoles
}: {
  children: ReactNode;
  role?: UserRole;
  allowedRoles?: UserRole[];
}) {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading…</div>
      </div>
    );
  }

  if (!user) {
    const isAdminRoute = role === 'admin' || allowedRoles?.includes('admin');
    if (isAdminRoute) {
      const passkeyVerified = typeof window !== 'undefined' && window.sessionStorage.getItem('hp_admin_passkey_ok') === 'true';
      return <Navigate to={passkeyVerified ? '/admin-login' : '/admin-passkey'} replace state={{ from: location }} />;
    }
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  const effectiveRole = profile?.role ?? user.role;
  const roleList = allowedRoles ?? (role ? [role] : undefined);

  if (roleList && roleList.length > 0 && !roleList.includes(effectiveRole)) {
    const target = effectiveRole === 'admin' ? '/admin' : effectiveRole === 'organization' ? '/cbo' : '/client';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}
