import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './lib/auth';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { InventoryPage } from './pages/InventoryPage';
import { KitOutPage } from './pages/KitOutPage';
import { KitStatusPage } from './pages/KitStatusPage';
import { KitTransferPage } from './pages/KitTransferPage';
import { LoginPage } from './pages/LoginPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { TransactionPage } from './pages/TransactionPage';

function AdminOnly() {
  const { user } = useAuth();
  return user?.role === 'ADMIN' ? <AdminUsersPage /> : <Navigate to="/" replace />;
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/change-password" element={<ChangePasswordPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="materials" element={<MaterialsPage />} />
        <Route path="inbound" element={<TransactionPage kind="in" />} />
        <Route path="outbound" element={<TransactionPage kind="out" />} />
        <Route path="kit-out" element={<KitOutPage />} />
        <Route path="kit-status" element={<KitStatusPage />} />
        <Route path="kit-plans" element={<Navigate to="/kit-status" replace />} />
        <Route path="kit-transfer" element={<KitTransferPage />} />
        <Route path="transfer" element={<TransactionPage kind="transfer" />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="admin/users" element={<AdminOnly />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
