import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export function ChangePasswordPage() {
  const { refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (data.newPassword !== data.confirmPassword) throw new Error('Mật khẩu xác nhận chưa khớp.');
      await api('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }) });
      await refresh(); navigate('/');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể đổi mật khẩu.'); }
    finally { setBusy(false); }
  }
  return <div className="auth-page"><div className="auth-panel"><h1>Đổi mật khẩu ban đầu</h1><p>Để bảo vệ tài khoản admin, hãy đặt mật khẩu mới trước khi tiếp tục.</p>{error && <div className="alert alert-error">{error}</div>}<form onSubmit={submit} className="form-stack"><label>Mật khẩu hiện tại<input name="currentPassword" type="password" required placeholder="Nhập mật khẩu hiện tại" /></label><label>Mật khẩu mới<input name="newPassword" type="password" required minLength={10} placeholder="Ít nhất 10 ký tự, có chữ hoa, số và ký tự đặc biệt" /></label><label>Xác nhận mật khẩu mới<input name="confirmPassword" type="password" required minLength={10} placeholder="Nhập lại mật khẩu mới" /></label><button className="button button-primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Đổi mật khẩu'}</button></form><button className="text-button" onClick={logout}>Đăng xuất</button></div></div>;
}
