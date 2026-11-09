import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { LoadingState } from '../components/Loading';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Material } from '../lib/types';

export function MaterialsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const materials = useQuery({ queryKey: ['materials', search], queryFn: () => api<Material[]>(`/materials?active=true${search ? `&search=${encodeURIComponent(search)}` : ''}`) });
  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => api('/materials', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['materials'] }); setShowForm(false); setError(''); },
    onError: (caught: Error) => setError(caught.message),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget));
    create.mutate({ ...data, minimumStock: Number(data.minimumStock || 0) });
  }
  const canEdit = user?.role !== 'VIEWER';
  return <>
    <PageHeader title="Danh mục vật tư" description="Danh mục dùng chung cho tất cả hub." action={canEdit && <button className="button button-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Đóng' : 'Thêm vật tư'}</button>} />
    {showForm && <form className="card form-grid" onSubmit={submit}><div className="span-full"><h2>Thêm vật tư</h2>{error && <div className="alert alert-error">{error}</div>}</div><label>Mã vật tư<input name="code" required placeholder="Ví dụ: VT-046" /></label><label>Tên vật tư<input name="name" required placeholder="Nhập tên vật tư" /></label><label>Nhóm<input name="category" required placeholder="Ví dụ: Điện tử & điều khiển" /></label><label>Đơn vị<input name="unit" required placeholder="Ví dụ: Cái, Cuộn, Tấm" /></label><label>Mức tồn tối thiểu<input name="minimumStock" type="number" min="0" step="0.001" defaultValue="0" placeholder="Nhập mức cảnh báo tồn" /></label><label className="span-full">Ghi chú<textarea name="note" rows={2} placeholder="Thông tin bổ sung về vật tư" /></label><div className="span-full"><button className="button button-primary" disabled={create.isPending}>{create.isPending ? 'Đang lưu…' : 'Lưu vật tư'}</button></div></form>}
    <div className="filters card compact"><label className="grow">Tìm kiếm<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mã hoặc tên vật tư" /></label></div>
    <div className="card table-wrap">{materials.isFetching ? <LoadingState message="Đang tải danh mục vật tư…" /> : <table><thead><tr><th>Mã</th><th>Tên vật tư</th><th>Nhóm</th><th>ĐVT</th><th className="number">Mức tối thiểu</th><th>Ghi chú</th></tr></thead><tbody>{materials.data?.map((material) => <tr key={material.id}><td className="mono">{material.code}</td><td className="strong">{material.name}</td><td>{material.category}</td><td>{material.unit}</td><td className="number">{Number(material.minimumStock).toLocaleString('vi-VN')}</td><td className="note-cell">{material.note || '—'}</td></tr>)}</tbody></table>}</div>
  </>;
}
