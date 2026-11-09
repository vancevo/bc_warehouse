import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { LoadingState } from '../components/Loading';
import { PageHeader } from '../components/PageHeader';
import { api } from '../lib/api';
import { KitSummary } from '../lib/types';

export function KitStatusPage() {
  const [hubId, setHubId] = useState('');
  const summary = useQuery({
    queryKey: ['kit-summary'],
    queryFn: () => api<KitSummary[]>('/kits/summary'),
  });
  const visibleHubs = hubId
    ? summary.data?.filter((item) => item.hub.id === hubId)
    : summary.data;

  return <>
    <PageHeader
      title="Tình trạng KIT theo hub"
      description="Số KIT có thể xuất được tính tự động từ tồn kho hiện tại; số đã xuất được cộng từ các phiếu Xuất KIT hoàn tất."
    />
    <div className="filters card compact">
      <label>Hub
        <select value={hubId} onChange={(event) => setHubId(event.target.value)}>
          <option value="">Tất cả hub</option>
          {summary.data?.map((item) => <option key={item.hub.id} value={item.hub.id}>{item.hub.code} — {item.hub.name}</option>)}
        </select>
      </label>
    </div>
    <div className="card table-wrap">
      {summary.isFetching ? <LoadingState message="Đang tính tình trạng KIT theo từng hub…" /> : <table>
        <thead><tr><th>Hub</th><th>Loại KIT</th><th className="number">Có thể xuất thêm</th><th className="number">Đã xuất</th></tr></thead>
        <tbody>
          {visibleHubs?.flatMap((hub) => hub.kits.map((kit) => <tr key={`${hub.hub.id}:${kit.id}`}>
            <td><strong>{hub.hub.code}</strong> — {hub.hub.name}</td>
            <td>{kit.code} — {kit.name}</td>
            <td className="number strong">{kit.maximum}</td>
            <td className="number">{kit.issuedQuantity}</td>
          </tr>))}
        </tbody>
      </table>}
    </div>
  </>;
}
