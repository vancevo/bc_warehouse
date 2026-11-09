import { useIsFetching, useIsMutating } from '@tanstack/react-query';

export function Spinner({ small = false }: { small?: boolean }) {
  return <span className={`spinner${small ? ' spinner-small' : ''}`} aria-hidden="true" />;
}

export function LoadingState({ message = 'Đang tải dữ liệu…' }: { message?: string }) {
  return <div className="loading-state" role="status" aria-live="polite"><Spinner /><span>{message}</span></div>;
}

export function GlobalActivity() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  if (fetching + mutating === 0) return null;
  return <div className="global-activity" role="status" aria-live="polite"><Spinner small /><span>{mutating > 0 ? 'Đang xử lý yêu cầu…' : 'Đang cập nhật dữ liệu…'}</span></div>;
}
