import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import { Status } from '../components/Status';
import { LoadingState } from '../components/Loading';
import { api } from '../lib/api';
import { User } from '../lib/types';
import { formatVietnameseDate } from '../lib/date';

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: ['admin-users'], queryFn: () => api<User[]>('/admin/users') });
  const action = useMutation({
    mutationFn: ({ id, endpoint, body }: { id: string; endpoint: string; body: object }) => api(`/admin/users/${id}/${endpoint}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });
  return <>
    <PageHeader title="Quản lý tài khoản" description="Duyệt tài khoản đăng ký bằng email công ty." />
    {action.error && <div className="alert alert-error">{action.error.message}</div>}
    <div className="card table-wrap">{users.isFetching ? <LoadingState message="Đang tải danh sách tài khoản…" /> : <table><thead><tr><th>Họ tên</th><th>Email</th><th>Ngày đăng ký</th><th>Quyền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{users.data?.map((account) => <tr key={account.id}><td className="strong">{account.fullName}</td><td>{account.email}</td><td>{formatVietnameseDate((account as User & { createdAt: string }).createdAt)}</td><td>{account.role}</td><td><Status value={account.status} /></td><td><div className="actions">{account.status === 'PENDING' && <><button className="button button-small button-primary" disabled={action.isPending} onClick={() => action.mutate({ id: account.id, endpoint: 'approve', body: { role: 'STAFF' } })}>{action.isPending && action.variables?.id === account.id ? 'Đang xử lý…' : 'Duyệt'}</button><button className="button button-small" disabled={action.isPending} onClick={() => action.mutate({ id: account.id, endpoint: 'status', body: { status: 'REJECTED' } })}>{action.isPending && action.variables?.id === account.id ? 'Đang xử lý…' : 'Từ chối'}</button></>}{account.status === 'APPROVED' && account.role !== 'ADMIN' && <button className="button button-small" disabled={action.isPending} onClick={() => action.mutate({ id: account.id, endpoint: 'status', body: { status: 'SUSPENDED' } })}>{action.isPending && action.variables?.id === account.id ? 'Đang xử lý…' : 'Khóa'}</button>}{['SUSPENDED', 'REJECTED'].includes(account.status) && <button className="button button-small" disabled={action.isPending} onClick={() => action.mutate({ id: account.id, endpoint: 'approve', body: { role: 'STAFF' } })}>{action.isPending && action.variables?.id === account.id ? 'Đang xử lý…' : 'Mở lại'}</button>}</div></td></tr>)}</tbody></table>}</div>
  </>;
}
