import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const links = [
  ['/', 'Tổng quan'],
  ['/inventory', 'Tồn kho'],
] as const;

export function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">BC</span>
          <div><strong>BrightChamps</strong><small>Quản lý kho</small></div>
        </div>
        <nav>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
          ))}
          <details className="nav-tree" open>
            <summary>Xuất / Nhập kho</summary>
            <div>
              <NavLink to="/inbound">Nhập kho</NavLink>
              <NavLink to="/outbound">Xuất kho</NavLink>
            </div>
          </details>
          <details className="nav-tree" open>
            <summary>Quản lý KIT</summary>
            <div>
              <NavLink to="/kit-out">Xuất KIT</NavLink>
              <NavLink to="/kit-status">Tình trạng KIT</NavLink>
            </div>
          </details>
          <details className="nav-tree" open>
            <summary>Chuyển Hub</summary>
            <div>
              <NavLink to="/transfer">Chuyển vật tư</NavLink>
              <NavLink to="/kit-transfer">Chuyển KIT</NavLink>
            </div>
          </details>
          <NavLink to="/history">Lịch sử</NavLink>
          {user?.role === 'ADMIN' && <NavLink to="/admin/users">Duyệt tài khoản</NavLink>}
        </nav>
        <div className="sidebar-user">
          <strong>{user?.fullName}</strong>
          <span>{user?.email}</span>
          <button className="button button-ghost" onClick={logout}>Đăng xuất</button>
        </div>
      </aside>
      <main className="main-content"><Outlet /></main>
    </div>
  );
}
