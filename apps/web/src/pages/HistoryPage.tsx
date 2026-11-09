import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Status } from '../components/Status';
import { LoadingState } from '../components/Loading';
import { api, downloadCsv } from '../lib/api';
import { Hub, Transaction } from '../lib/types';
import { formatVietnameseDate } from '../lib/date';

export function HistoryPage() {
  const [hubId, setHubId] = useState('');
  const [type, setType] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const hubs = useQuery({ queryKey: ['hubs'], queryFn: () => api<Hub[]>('/hubs') });
  const transactions = useQuery({ queryKey: ['transactions', hubId, type], queryFn: () => api<Transaction[]>(`/transactions?${new URLSearchParams({ ...(hubId && { hubId }), ...(type && { type }) })}`) });
  return <>
    <PageHeader title="Lịch sử giao dịch" description="Nhật ký nhập, xuất, chuyển vật tư và chuyển KIT." action={<button className="button" disabled={downloading} onClick={async () => { setDownloading(true); setDownloadError(''); try { await downloadCsv(`/exports/transactions.csv${hubId ? `?hubId=${hubId}` : ''}`, 'lich-su-kho.csv'); } catch (error) { setDownloadError(error instanceof Error ? error.message : 'Không thể tải CSV.'); } finally { setDownloading(false); } }}>{downloading ? 'Đang tạo CSV…' : 'Tải CSV'}</button>} />
    {downloadError && <div className="alert alert-error">{downloadError}</div>}
    <div className="filters card compact"><label>Hub<select value={hubId} onChange={(e) => setHubId(e.target.value)}><option value="">Tất cả</option>{hubs.data?.map((hub) => <option key={hub.id} value={hub.id}>{hub.code}</option>)}</select></label><label>Loại<select value={type} onChange={(e) => setType(e.target.value)}><option value="">Tất cả</option><option value="IN">Nhập kho</option><option value="OUT">Xuất vật tư</option><option value="KIT_OUT">Xuất KIT</option><option value="TRANSFER">Chuyển vật tư</option><option value="KIT_TRANSFER">Chuyển KIT</option><option value="ADJUSTMENT">Số dư đầu kỳ</option></select></label></div>
    <div className="card table-wrap">{transactions.isFetching ? <LoadingState message="Đang tải lịch sử giao dịch…" /> : <table><thead><tr><th>Số phiếu</th><th>Ngày</th><th>Loại</th><th>Hub</th><th>Chi tiết</th><th>Người tạo</th><th>Trạng thái</th></tr></thead><tbody>{transactions.data?.length === 0 && <tr><td colSpan={7} className="empty">Chưa có giao dịch.</td></tr>}{transactions.data?.map((transaction) => <tr key={transaction.id}><td className="mono">{transaction.transactionNo}</td><td>{formatVietnameseDate(transaction.transactionDate)}</td><td><Status value={transaction.type} /></td><td><strong>{transaction.hub.code}</strong>{transaction.destinationHub && ` → ${transaction.destinationHub.code}`}</td><td>{transaction.kit && <strong>{transaction.kit.code}: {transaction.kitQuantity} bộ<br /></strong>}<details><summary>{transaction.items.length} vật tư</summary><ul className="detail-list">{transaction.items.map((item) => <li key={item.id}>{item.material.code}: {Number(item.quantity).toLocaleString('vi-VN')} {item.material.unit}</li>)}</ul></details></td><td>{transaction.createdBy.fullName}</td><td><Status value={transaction.status} /></td></tr>)}</tbody></table>}</div>
  </>;
}
