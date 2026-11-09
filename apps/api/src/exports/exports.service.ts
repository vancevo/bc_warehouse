import { Injectable } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class ExportsService {
  constructor(
    private readonly inventory: InventoryService,
    private readonly transactions: TransactionsService,
  ) {}

  async inventoryCsv(hubId?: string) {
    const rows = await this.inventory.list(hubId);
    return this.csv(
      ['Hub', 'Mã vật tư', 'Tên vật tư', 'Nhóm', 'ĐVT', 'Tồn kho', 'Mức tối thiểu', 'Trạng thái'],
      rows.map((row) => [
        row.hub.code,
        row.material.code,
        row.material.name,
        row.material.category,
        row.material.unit,
        row.quantity,
        row.minimumStock,
        row.status,
      ]),
    );
  }

  async transactionsCsv(hubId?: string) {
    const transactions = await this.transactions.list({ hubId });
    const rows = transactions.flatMap((transaction) =>
      transaction.items.map((item) => [
        transaction.transactionNo,
        transaction.transactionDate.toISOString(),
        transaction.type,
        transaction.status,
        transaction.hub.code,
        transaction.destinationHub?.code ?? '',
        transaction.kit?.code ?? '',
        transaction.kitQuantity ?? '',
        item.material.code,
        item.material.name,
        Number(item.quantity),
        item.material.unit,
        transaction.counterparty ?? '',
        transaction.createdBy.fullName,
      ]),
    );
    return this.csv(
      ['Số phiếu', 'Ngày', 'Loại', 'Trạng thái', 'Hub nguồn', 'Hub nhận', 'KIT', 'Số bộ', 'Mã vật tư', 'Tên vật tư', 'Số lượng', 'ĐVT', 'Đối tác/Người nhận', 'Người tạo'],
      rows,
    );
  }

  private csv(headers: string[], rows: Array<Array<string | number>>) {
    const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    return `\uFEFF${[headers, ...rows].map((row) => row.map(escape).join(',')).join('\n')}`;
  }
}
