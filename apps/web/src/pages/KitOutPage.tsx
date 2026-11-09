import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { LoadingState } from '../components/Loading';
import { VietnameseDateInput } from '../components/VietnameseDateInput';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Hub, Kit, KitSummary } from '../lib/types';
import { parseVietnameseDate } from '../lib/date';

export function KitOutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hubId, setHubId] = useState('');
  const [kitId, setKitId] = useState('');
  const [kitQuantity, setKitQuantity] = useState(1);
  const [error, setError] = useState('');
  const hubs = useQuery({ queryKey: ['hubs'], queryFn: () => api<Hub[]>('/hubs') });
  const kits = useQuery({ queryKey: ['kits'], queryFn: () => api<Kit[]>('/kits') });
  const summary = useQuery({
    queryKey: ['kit-summary', hubId],
    enabled: Boolean(hubId),
    queryFn: () => api<KitSummary[]>(`/kits/summary?hubId=${hubId}`),
  });

  useEffect(() => {
    if (!hubId && hubs.data?.length) {
      setHubId(hubs.data.find((hub) => hub.code === 'D7')?.id ?? hubs.data[0].id);
    }
  }, [hubId, hubs.data]);
  useEffect(() => {
    if (!kitId && kits.data?.length) setKitId(kits.data[0].id);
  }, [kitId, kits.data]);

  const selectedKit = kits.data?.find((kit) => kit.id === kitId);
  const selectedSummary = useMemo(
    () => summary.data?.[0]?.kits.find((kit) => kit.id === kitId),
    [summary.data, kitId],
  );
  const availableToIssue = selectedSummary?.maximum ?? 0;
  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => api('/transactions/kit-out', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      navigate('/history');
    },
    onError: (caught: Error) => setError(caught.message),
  });

  if (hubs.isLoading || kits.isLoading) return <LoadingState message="Đang tải định mức KIT và danh sách hub…" />;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (!selectedSummary || kitQuantity > availableToIssue) {
      setError(`Chỉ có thể xuất tối đa ${availableToIssue} bộ theo tồn kho hiện tại.`);
      return;
    }
    let transactionDate: string;
    try { transactionDate = parseVietnameseDate(String(data.transactionDate)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Ngày xuất không hợp lệ.'); return; }
    create.mutate({
      hubId,
      kitId,
      kitQuantity,
      transactionDate,
      counterparty: data.counterparty,
      note: data.note,
    });
  }

  return <>
    <PageHeader title="Xuất KIT" description="Hệ thống tự bung định mức, kiểm tra đủ toàn bộ vật tư rồi mới trừ kho." />
    {summary.isFetching ? <div className="card"><LoadingState message="Đang tính số KIT có thể xuất…" /></div> : <div className="stats-grid kit-stats">
      {summary.data?.[0]?.kits.map((kit) => <article className="stat-card" key={kit.id}><span>{kit.code} — {kit.name}</span><strong>{kit.maximum}</strong><small>có thể xuất thêm tại {summary.data?.[0].hub.code} · đã xuất {kit.issuedQuantity}</small></article>)}
    </div>}
    <form className="card transaction-form" onSubmit={submit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-grid">
        <label>Hub xuất<select value={hubId} onChange={(event) => setHubId(event.target.value)} required>{hubs.data?.map((hub) => <option key={hub.id} value={hub.id}>{hub.code} — {hub.name}</option>)}</select></label>
        <label>Loại KIT<select value={kitId} onChange={(event) => setKitId(event.target.value)} required>{kits.data?.map((kit) => <option key={kit.id} value={kit.id}>{kit.code} — {kit.name}</option>)}</select></label>
        <label>Số bộ xuất<input type="number" min="1" max={availableToIssue || 1} value={kitQuantity} onChange={(event) => setKitQuantity(Number(event.target.value))} required placeholder="Nhập số bộ KIT" /></label>
        <label>Ngày xuất<VietnameseDateInput name="transactionDate" /></label>
        <label>Người nhận / Hub<input name="counterparty" required placeholder="Nhập người nhận hoặc hub nhận" /></label>
        <label>Ghi chú<input name="note" placeholder="Nội dung hoặc mục đích xuất KIT" /></label>
      </div>
      {selectedSummary && <div className="capacity-note"><strong>Có thể xuất thêm tối đa {availableToIssue} bộ theo tồn hiện tại.</strong><span> Hub này đã xuất {selectedSummary.issuedQuantity} bộ {selectedSummary.code}.</span>{selectedSummary.limitingMaterials.length > 0 && <span> Giới hạn tồn bởi {selectedSummary.limitingMaterials.map((item) => `${item.material.code} (${item.stock} ${item.material.unit})`).join(', ')}.</span>}</div>}
      {selectedKit && <details className="kit-detail"><summary>Định mức {selectedKit.code}: {selectedKit.items.length} mã vật tư</summary><div className="table-wrap"><table><thead><tr><th>Mã</th><th>Vật tư</th><th className="number">Mỗi bộ</th><th className="number">Cần xuất</th><th>ĐVT</th></tr></thead><tbody>{selectedKit.items.map((item) => <tr key={item.id}><td className="mono">{item.material.code}</td><td>{item.material.name}</td><td className="number">{Number(item.quantity)}</td><td className="number strong">{Number(item.quantity) * kitQuantity}</td><td>{item.material.unit}</td></tr>)}</tbody></table></div></details>}
      <div className="form-actions"><button className="button button-primary" disabled={create.isPending || summary.isFetching || user?.role === 'VIEWER' || availableToIssue === 0}>{create.isPending ? 'Đang kiểm tra tồn và xuất…' : summary.isFetching ? 'Đang tính khả năng xuất…' : 'Xác nhận xuất KIT'}</button></div>
    </form>
  </>;
}
