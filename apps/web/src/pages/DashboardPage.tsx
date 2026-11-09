import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Status } from '../components/Status';
import { LoadingState } from '../components/Loading';
import { formatVietnameseDate } from '../lib/date';

interface Summary {
  totalMaterials: number;
  totalHubs: number;
  pendingUsers: number;
  hubSummary: Array<{ hubId: string; code: string; name: string; stockedMaterials: number; lowStock: number; outOfStock: number }>;
  kitSummary: Array<{ hub: { id: string; code: string; name: string }; kits: Array<{ id: string; code: string; name: string; maximum: number; issuedQuantity: number }> }>;
  recentTransactions: Array<{ id: string; transactionNo: string; type: string; status: string; transactionDate: string; hub: { code: string }; destinationHub?: { code: string }; kit?: { code: string; name: string }; kitQuantity?: number; createdBy: { fullName: string }; _count: { items: number } }>;
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Summary>('/dashboard/summary') });
  if (isLoading || !data) return <LoadingState message="Đang tải tổng quan kho…" />;
  return <>
    <PageHeader title="Tổng quan kho" description="Tình trạng vật tư tại 5 hub BrightChamps." />
    <section className="stats-grid">
      <article className="stat-card"><span>Vật tư</span><strong>{data.totalMaterials}</strong><small>mã đang hoạt động</small></article>
      <article className="stat-card"><span>Hub</span><strong>{data.totalHubs}</strong><small>điểm quản lý</small></article>
      <article className="stat-card"><span>Chờ duyệt</span><strong>{data.pendingUsers}</strong><small>tài khoản mới</small></article>
    </section>
    <section className="card"><div className="card-heading"><h2>Tình trạng KIT theo hub</h2></div><div className="table-wrap"><table><thead><tr><th>Hub</th><th>Loại KIT</th><th className="number">Có thể xuất thêm theo tồn</th><th className="number">Đã xuất</th></tr></thead><tbody>{data.kitSummary.flatMap((hub) => hub.kits.map((kit) => <tr key={`${hub.hub.id}-${kit.id}`}><td><strong>{hub.hub.code}</strong> — {hub.hub.name}</td><td>{kit.code} — {kit.name}</td><td className="number strong">{kit.maximum}</td><td className="number">{kit.issuedQuantity}</td></tr>))}</tbody></table></div></section>
    <section className="card"><div className="card-heading"><h2>Tồn kho theo hub</h2></div><div className="hub-grid">{data.hubSummary.map((hub) => <article className="hub-card" key={hub.hubId}><div><strong>{hub.code}</strong><span>{hub.name}</span></div><dl><div><dt>Có tồn</dt><dd>{hub.stockedMaterials}</dd></div><div><dt>Sắp hết</dt><dd className="warning-text">{hub.lowStock}</dd></div><div><dt>Hết hàng</dt><dd className="danger-text">{hub.outOfStock}</dd></div></dl></article>)}</div></section>
    <section className="card"><div className="card-heading"><h2>Giao dịch gần đây</h2></div><div className="table-wrap"><table><thead><tr><th>Số phiếu</th><th>Loại</th><th>Hub</th><th>Chi tiết</th><th>Người tạo</th><th>Ngày</th><th>Trạng thái</th></tr></thead><tbody>{data.recentTransactions.length === 0 ? <tr><td colSpan={7} className="empty">Chưa có giao dịch.</td></tr> : data.recentTransactions.map((transaction) => <tr key={transaction.id}><td className="mono">{transaction.transactionNo}</td><td><Status value={transaction.type} /></td><td>{transaction.hub.code}{transaction.destinationHub ? ` → ${transaction.destinationHub.code}` : ''}</td><td>{transaction.kit ? `${transaction.kit.code}: ${transaction.kitQuantity} bộ` : `${transaction._count.items} vật tư`}</td><td>{transaction.createdBy.fullName}</td><td>{formatVietnameseDate(transaction.transactionDate)}</td><td><Status value={transaction.status} /></td></tr>)}</tbody></table></div></section>
  </>;
}
