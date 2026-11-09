import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingState } from '../components/Loading';
import { PageHeader } from '../components/PageHeader';
import { VietnameseDateInput } from '../components/VietnameseDateInput';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { parseVietnameseDate } from '../lib/date';
import { Hub, Kit, KitSummary } from '../lib/types';

export function KitTransferPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hubId, setHubId] = useState('');
  const [destinationHubId, setDestinationHubId] = useState('');
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
    if (!hubs.data?.length) return;
    const source = hubId || hubs.data.find((hub) => hub.code === 'D7')?.id || hubs.data[0].id;
    if (!hubId) setHubId(source);
    if (!destinationHubId || destinationHubId === source) {
      setDestinationHubId(hubs.data.find((hub) => hub.id !== source)?.id ?? '');
    }
  }, [hubs.data, hubId, destinationHubId]);
  useEffect(() => {
    if (!kitId && kits.data?.length) setKitId(kits.data[0].id);
  }, [kitId, kits.data]);

  const selectedKit = kits.data?.find((kit) => kit.id === kitId);
  const selectedSummary = useMemo(() => summary.data?.[0]?.kits.find((kit) => kit.id === kitId), [summary.data, kitId]);
  const transferable = selectedSummary?.maximum ?? 0;
  const transfer = useMutation({
    mutationFn: (body: Record<string, unknown>) => api('/transactions/kit-transfer', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      navigate('/history');
    },
    onError: (caught: Error) => setError(caught.message),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (hubId === destinationHubId) { setError('Hub nguồn và hub nhận phải khác nhau.'); return; }
    if (kitQuantity > transferable) { setError(`Chỉ có thể chuyển tối đa ${transferable} bộ theo tồn kho hiện tại.`); return; }
    let transactionDate: string;
    try { transactionDate = parseVietnameseDate(String(data.transactionDate)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Ngày chuyển không hợp lệ.'); return; }
    transfer.mutate({
      hubId,
      destinationHubId,
      kitId,
      kitQuantity,
      transactionDate,
      counterparty: data.counterparty,
      note: data.note,
    });
  }

  if (hubs.isLoading || kits.isLoading) return <LoadingState message="Đang tải hub và định mức KIT…" />;
  return <>
    <PageHeader title="Chuyển KIT giữa các hub" description="Chuyển đủ vật tư theo định mức KIT từ hub nguồn sang hub nhận." />
    <form className="card transaction-form" onSubmit={submit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-grid">
        <label>Hub nguồn<select value={hubId} onChange={(event) => setHubId(event.target.value)} required><option value="" disabled>Chọn hub nguồn</option>{hubs.data?.map((hub) => <option key={hub.id} value={hub.id}>{hub.code} — {hub.name}</option>)}</select></label>
        <label>Hub nhận<select value={destinationHubId} onChange={(event) => setDestinationHubId(event.target.value)} required><option value="" disabled>Chọn hub nhận</option>{hubs.data?.filter((hub) => hub.id !== hubId).map((hub) => <option key={hub.id} value={hub.id}>{hub.code} — {hub.name}</option>)}</select></label>
        <label>Loại KIT<select value={kitId} onChange={(event) => setKitId(event.target.value)} required><option value="" disabled>Chọn loại KIT</option>{kits.data?.map((kit) => <option key={kit.id} value={kit.id}>{kit.code} — {kit.name}</option>)}</select></label>
        <label>Số bộ chuyển<input type="number" min="1" max={transferable || 1} value={kitQuantity} onChange={(event) => setKitQuantity(Number(event.target.value))} placeholder="Nhập số bộ KIT" required /></label>
        <label>Ngày chuyển<VietnameseDateInput name="transactionDate" /></label>
        <label>Người phụ trách<input name="counterparty" placeholder="Nhập người giao hoặc người nhận" /></label>
        <label className="span-full">Ghi chú<textarea name="note" rows={2} placeholder="Nội dung hoặc lý do chuyển KIT" /></label>
      </div>
      {summary.isFetching ? <LoadingState message="Đang tính khả năng chuyển KIT…" /> : selectedSummary && <div className="capacity-note"><strong>Có thể chuyển tối đa {transferable} bộ theo tồn hiện tại.</strong><span> Hub nguồn đã xuất {selectedSummary.issuedQuantity} bộ {selectedSummary.code}.</span></div>}
      {selectedKit && <details className="kit-detail"><summary>Vật tư sẽ chuyển theo định mức {selectedKit.code}</summary><div className="table-wrap"><table><thead><tr><th>Mã</th><th>Vật tư</th><th className="number">Mỗi bộ</th><th className="number">Tổng chuyển</th><th>ĐVT</th></tr></thead><tbody>{selectedKit.items.map((item) => <tr key={item.id}><td className="mono">{item.material.code}</td><td>{item.material.name}</td><td className="number">{Number(item.quantity)}</td><td className="number strong">{Number(item.quantity) * kitQuantity}</td><td>{item.material.unit}</td></tr>)}</tbody></table></div></details>}
      <div className="form-actions"><button className="button button-primary" disabled={transfer.isPending || summary.isFetching || user?.role === 'VIEWER' || transferable === 0}>{transfer.isPending ? 'Đang kiểm tra và chuyển KIT…' : 'Xác nhận chuyển KIT'}</button></div>
    </form>
  </>;
}
