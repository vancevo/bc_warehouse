export function Status({ value }: { value: string }) {
  const labels: Record<string, string> = {
    IN_STOCK: 'Còn hàng', LOW_STOCK: 'Sắp hết', OUT_OF_STOCK: 'Hết hàng',
    POSTED: 'Đã ghi nhận', VOID: 'Đã hủy', PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối', SUSPENDED: 'Đã khóa', IN: 'Nhập kho', OUT: 'Xuất kho', TRANSFER: 'Chuyển hub',
    ADJUSTMENT: 'Số dư đầu kỳ', KIT_OUT: 'Xuất KIT', KIT_TRANSFER: 'Chuyển KIT',
  };
  return <span className={`status status-${value.toLowerCase()}`}>{labels[value] ?? value}</span>;
}
