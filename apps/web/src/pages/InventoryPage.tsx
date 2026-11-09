import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Status } from '../components/Status';
import { LoadingState } from '../components/Loading';
import { api, downloadCsv } from '../lib/api';
import { Hub, InventoryRow } from '../lib/types';

export function InventoryPage() {
  const [hubId, setHubId] = useState('');
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const hubs = useQuery({ queryKey: ['hubs'], queryFn: () => api<Hub[]>('/hubs') });
  const rows = useQuery({
    queryKey: ['inventory', hubId, search, lowStock],
    queryFn: () => api<InventoryRow[]>(`/inventory?${new URLSearchParams({ ...(hubId && { hubId }), ...(search && { search }), ...(lowStock && { lowStock: 'true' }) })}`),
  });
  return <>
    <PageHeader title="Tồn kho" description="Xem số lượng vật tư tại từng hub." action={<button className="button" disabled={downloading} onClick={async () => { setDownloading(true); setDownloadError(''); try { await downloadCsv(`/exports/inventory.csv${hubId ? `?hubId=${hubId}` : ''}`, 'ton-kho.csv'); } catch (error) { setDownloadError(error instanceof Error ? error.message : 'Không thể tải CSV.'); } finally { setDownloading(false); } }}>{downloading ? 'Đang tạo CSV…' : 'Tải CSV'}</button>} />
    {downloadError && <div className="alert alert-error">{downloadError}</div>}
    <div className="filters card compact"><label>Hub<select value={hubId} onChange={(e) => setHubId(e.target.value)}><option value="">Tất cả hub</option>{hubs.data?.map((hub) => <option key={hub.id} value={hub.id}>{hub.code} — {hub.name}</option>)}</select></label><label className="grow">Tìm vật tư<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mã hoặc tên vật tư" /></label><label className="checkbox"><input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} /> Chỉ hiện sắp hết/hết</label></div>
    <div className="card table-wrap">{rows.isFetching ? <LoadingState message="Đang cập nhật tồn kho…" /> : <table><thead><tr><th>Hub</th><th>Mã</th><th>Vật tư</th><th>Nhóm</th><th className="number">Tồn</th><th>ĐVT</th><th className="number">Tối thiểu</th><th>Trạng thái</th></tr></thead><tbody>{rows.data?.map((row) => <tr key={`${row.hub.id}-${row.material.id}`}><td><strong>{row.hub.code}</strong></td><td className="mono">{row.material.code}</td><td>{row.material.name}</td><td>{row.material.category}</td><td className="number strong">{row.quantity.toLocaleString('vi-VN')}</td><td>{row.material.unit}</td><td className="number">{row.minimumStock.toLocaleString('vi-VN')}</td><td><Status value={row.status} /></td></tr>)}</tbody></table>}</div>
  </>;
}
