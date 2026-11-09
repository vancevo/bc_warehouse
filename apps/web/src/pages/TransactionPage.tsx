import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { LoadingState } from '../components/Loading';
import { VietnameseDateInput } from '../components/VietnameseDateInput';
import { api } from '../lib/api';
import { Hub, Material } from '../lib/types';
import { parseVietnameseDate } from '../lib/date';

type Kind = 'in' | 'out' | 'transfer';
interface Line { materialId: string; quantity: string; note: string }

const config = {
  in: { title: 'Nhập kho', description: 'Ghi nhận vật tư nhập vào một hub.', counterparty: 'Nhà cung cấp / Người giao', counterpartyPlaceholder: 'Nhập nhà cung cấp hoặc người giao' },
  out: { title: 'Xuất kho', description: 'Xuất vật tư và tự động trừ tồn của hub.', counterparty: 'Người nhận / Mục đích', counterpartyPlaceholder: 'Nhập người nhận hoặc mục đích xuất' },
  transfer: { title: 'Chuyển hub', description: 'Chuyển vật tư giữa hai hub trong cùng một giao dịch.', counterparty: 'Người nhận / Phụ trách', counterpartyPlaceholder: 'Nhập người nhận hoặc người phụ trách' },
} as const;

export function TransactionPage({ kind }: { kind: Kind }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [lines, setLines] = useState<Line[]>([{ materialId: '', quantity: '', note: '' }]);
  const [error, setError] = useState('');
  const hubs = useQuery({ queryKey: ['hubs'], queryFn: () => api<Hub[]>('/hubs') });
  const materials = useQuery({ queryKey: ['materials', 'active'], queryFn: () => api<Material[]>('/materials?active=true') });
  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => api(`/transactions/${kind}`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: async () => { await queryClient.invalidateQueries(); navigate('/history'); },
    onError: (caught: Error) => setError(caught.message),
  });
  if (hubs.isLoading || materials.isLoading) return <LoadingState message="Đang tải hub và danh mục vật tư…" />;
  function updateLine(index: number, field: keyof Line, value: string) {
    setLines((current) => current.map((line, i) => i === index ? { ...line, [field]: value } : line));
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (lines.some((line) => !line.materialId || Number(line.quantity) <= 0)) { setError('Vui lòng chọn vật tư và nhập số lượng lớn hơn 0.'); return; }
    let transactionDate: string;
    try { transactionDate = parseVietnameseDate(String(data.transactionDate)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Ngày giao dịch không hợp lệ.'); return; }
    create.mutate({
      hubId: data.hubId,
      ...(kind === 'transfer' && { destinationHubId: data.destinationHubId }),
      transactionDate,
      counterparty: data.counterparty,
      note: data.note,
      items: lines.map((line) => ({ materialId: line.materialId, quantity: Number(line.quantity), note: line.note || undefined })),
    });
  }
  return <>
    <PageHeader title={config[kind].title} description={config[kind].description} />
    <form className="card transaction-form" onSubmit={submit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-grid">
        <label>Hub {kind === 'transfer' ? 'nguồn' : ''}<select name="hubId" required><option value="">Chọn hub</option>{hubs.data?.map((hub) => <option key={hub.id} value={hub.id}>{hub.code} — {hub.name}</option>)}</select></label>
        {kind === 'transfer' && <label>Hub nhận<select name="destinationHubId" required><option value="">Chọn hub nhận</option>{hubs.data?.map((hub) => <option key={hub.id} value={hub.id}>{hub.code} — {hub.name}</option>)}</select></label>}
        <label>Ngày giao dịch<VietnameseDateInput name="transactionDate" /></label>
        <label>{config[kind].counterparty}<input name="counterparty" placeholder={config[kind].counterpartyPlaceholder} /></label>
        <label className="span-full">Ghi chú phiếu<textarea name="note" rows={2} placeholder="Nhập nội dung hoặc ghi chú cho phiếu" /></label>
      </div>
      <div className="line-heading"><h2>Vật tư</h2><button className="button" type="button" onClick={() => setLines([...lines, { materialId: '', quantity: '', note: '' }])}>Thêm dòng</button></div>
      <div className="transaction-lines">
        {lines.map((line, index) => <div className="transaction-line" key={index}>
          <label>Vật tư<select value={line.materialId} onChange={(e) => updateLine(index, 'materialId', e.target.value)} required><option value="">Chọn vật tư</option>{materials.data?.map((material) => <option key={material.id} value={material.id}>{material.code} — {material.name} ({material.unit})</option>)}</select></label>
          <label>Số lượng<input type="number" min="0.001" step="0.001" value={line.quantity} onChange={(e) => updateLine(index, 'quantity', e.target.value)} required placeholder="Nhập số lượng" /></label>
          <label>Ghi chú dòng<input value={line.note} onChange={(e) => updateLine(index, 'note', e.target.value)} placeholder="Ghi chú riêng cho vật tư" /></label>
          <button className="icon-button danger-text" type="button" disabled={lines.length === 1} onClick={() => setLines(lines.filter((_, i) => i !== index))}>Xóa</button>
        </div>)}
      </div>
      <div className="form-actions"><button className="button button-primary" disabled={create.isPending}>{create.isPending ? 'Đang kiểm tra tồn và ghi nhận…' : `Xác nhận ${config[kind].title.toLowerCase()}`}</button></div>
    </form>
  </>;
}
