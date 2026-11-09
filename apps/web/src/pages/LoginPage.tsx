import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.mustChangePassword ? '/change-password' : '/'} replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setMessage(''); setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (mode === 'login') {
        const loggedIn = await login(String(data.email), String(data.password));
        navigate(loggedIn.mustChangePassword ? '/change-password' : '/');
      } else {
        if (data.password !== data.confirmPassword) throw new Error('Mật khẩu xác nhận chưa khớp.');
        const result = await api<{ message: string }>('/auth/register', {
          method: 'POST', body: JSON.stringify({ fullName: data.fullName, email: data.email, password: data.password }),
        });
        setMessage(result.message);
        setMode('login');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Có lỗi xảy ra.');
    } finally { setBusy(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="brand auth-brand"><span className="brand-mark">BC</span><div><strong>BrightChamps</strong><small>Quản lý kho vật tư</small></div></div>
        <h1>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}</h1>
        <p>{mode === 'login' ? 'Sử dụng tài khoản đã được admin phê duyệt.' : 'Chỉ chấp nhận email @team.brightchamps.com.'}</p>
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        <form onSubmit={submit} className="form-stack">
          {mode === 'register' && <label>Họ và tên<input name="fullName" required minLength={2} placeholder="Nguyễn Văn A" /></label>}
          <label>Email công ty<input name="email" type="email" required placeholder="ten@team.brightchamps.com" /></label>
          <label>Mật khẩu<input name="password" type="password" required minLength={10} placeholder="Nhập mật khẩu" /></label>
          {mode === 'register' && <label>Xác nhận mật khẩu<input name="confirmPassword" type="password" required minLength={10} placeholder="Nhập lại mật khẩu" /></label>}
          <button className="button button-primary" disabled={busy}>{busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Gửi đăng ký'}</button>
        </form>
        <button className="text-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setMessage(''); }}>
          {mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
        </button>
      </div>
    </div>
  );
}
