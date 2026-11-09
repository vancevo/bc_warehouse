import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { LoadingState } from './Loading';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen"><LoadingState message="Đang xác thực phiên đăng nhập…" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  return <Outlet />;
}
