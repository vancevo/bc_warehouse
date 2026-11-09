import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { CreateKitOutDto, CreateKitTransferDto, CreateTransactionDto } from './transactions.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(filters: { hubId?: string; type?: TransactionType; from?: string; to?: string }) {
    const where: Prisma.StockTransactionWhereInput = {};
    if (filters.hubId) {
      where.OR = [{ hubId: filters.hubId }, { destinationHubId: filters.hubId }];
    }
    if (filters.type) where.type = filters.type;
    if (filters.from || filters.to) {
      where.transactionDate = {
        ...(filters.from && { gte: new Date(filters.from) }),
        ...(filters.to && { lte: new Date(`${filters.to}T23:59:59.999Z`) }),
      };
    }
    return this.prisma.stockTransaction.findMany({
      where,
      include: {
        hub: { select: { id: true, code: true } },
        destinationHub: { select: { id: true, code: true } },
        kit: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
        items: { include: { material: { select: { id: true, code: true, name: true, unit: true } } } },
      },
      orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
      take: 500,
    });
  }

  async get(id: string) {
    const transaction = await this.prisma.stockTransaction.findUnique({
      where: { id },
      include: { hub: true, destinationHub: true, kit: true, createdBy: true, voidedBy: true, items: { include: { material: true } } },
    });
    if (!transaction) throw new NotFoundException('Không tìm thấy phiếu kho.');
    return transaction;
  }

  create(type: TransactionType, dto: CreateTransactionDto, userId: string) {
    if (type === 'TRANSFER') {
      if (!dto.destinationHubId) throw new BadRequestException('Vui lòng chọn hub nhận.');
      if (dto.destinationHubId === dto.hubId) throw new BadRequestException('Hub nguồn và hub nhận phải khác nhau.');
    }
    const duplicate = new Set<string>();
    for (const item of dto.items) {
      if (duplicate.has(item.materialId)) throw new BadRequestException('Một vật tư chỉ được xuất hiện một lần trong phiếu.');
      duplicate.add(item.materialId);
    }

    return this.prisma.$transaction(async (tx) => {
      const [hubCount, materialCount] = await Promise.all([
        tx.hub.count({ where: { id: { in: [dto.hubId, ...(dto.destinationHubId ? [dto.destinationHubId] : [])] }, active: true } }),
        tx.material.count({ where: { id: { in: dto.items.map((item) => item.materialId) }, active: true } }),
      ]);
      const expectedHubCount = dto.destinationHubId ? 2 : 1;
      if (hubCount !== expectedHubCount) throw new BadRequestException('Hub không tồn tại hoặc đã ngừng hoạt động.');
      if (materialCount !== dto.items.length) throw new BadRequestException('Có vật tư không tồn tại hoặc đã ngừng sử dụng.');

      if (type === 'OUT' || type === 'TRANSFER') {
        for (const item of dto.items) await this.decrementStock(tx, dto.hubId, item.materialId, item.quantity);
      }
      if (type === 'IN') {
        for (const item of dto.items) await this.incrementStock(tx, dto.hubId, item.materialId, item.quantity);
      }
      if (type === 'TRANSFER' && dto.destinationHubId) {
        for (const item of dto.items) await this.incrementStock(tx, dto.destinationHubId, item.materialId, item.quantity);
      }

      return tx.stockTransaction.create({
        data: {
          transactionNo: this.transactionNo(type),
          type,
          hubId: dto.hubId,
          destinationHubId: type === 'TRANSFER' ? dto.destinationHubId : null,
          transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
          counterparty: dto.counterparty?.trim() || null,
          note: dto.note?.trim() || null,
          createdById: userId,
          items: {
            create: dto.items.map((item) => ({
              materialId: item.materialId,
              quantity: item.quantity,
              note: item.note?.trim() || null,
            })),
          },
        },
        include: { items: { include: { material: true } }, hub: true, destinationHub: true },
      });
    });
  }

  createKitOut(dto: CreateKitOutDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const [hub, kit] = await Promise.all([
        tx.hub.findFirst({ where: { id: dto.hubId, active: true } }),
        tx.kit.findFirst({
          where: { id: dto.kitId, active: true },
          include: { items: { include: { material: { select: { code: true, name: true, unit: true } } } } },
        }),
      ]);
      if (!hub) throw new BadRequestException('Hub không tồn tại hoặc đã ngừng hoạt động.');
      if (!kit || kit.items.length === 0) throw new BadRequestException('KIT không tồn tại hoặc chưa có định mức vật tư.');

      const stocks = await tx.stock.findMany({
        where: { hubId: dto.hubId, materialId: { in: kit.items.map((item) => item.materialId) } },
      });
      const stockMap = new Map(stocks.map((stock) => [stock.materialId, Number(stock.quantity)]));
      const requirements = kit.items.map((item) => ({
        ...item,
        required: Number(item.quantity) * dto.kitQuantity,
        stock: stockMap.get(item.materialId) ?? 0,
      }));
      const shortages = requirements.filter((item) => item.stock < item.required);
      if (shortages.length) {
        const details = shortages
          .slice(0, 8)
          .map((item) => `${item.material.code}: cần ${item.required}, tồn ${item.stock}`)
          .join('; ');
        throw new BadRequestException(`Không đủ tồn kho để xuất ${dto.kitQuantity} ${kit.code}. Thiếu: ${details}.`);
      }

      for (const item of requirements) {
        await this.decrementStock(tx, dto.hubId, item.materialId, item.required);
      }

      return tx.stockTransaction.create({
        data: {
          transactionNo: this.transactionNo(TransactionType.KIT_OUT),
          type: TransactionType.KIT_OUT,
          hubId: dto.hubId,
          kitId: kit.id,
          kitQuantity: dto.kitQuantity,
          transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
          counterparty: dto.counterparty?.trim() || null,
          note: dto.note?.trim() || null,
          createdById: userId,
          items: {
            create: requirements.map((item) => ({
              materialId: item.materialId,
              quantity: item.required,
              note: `${Number(item.quantity)} ${item.material.unit}/bộ × ${dto.kitQuantity} bộ`,
            })),
          },
        },
        include: { kit: true, hub: true, items: { include: { material: true } } },
      });
    });
  }

  createKitTransfer(dto: CreateKitTransferDto, userId: string) {
    if (dto.hubId === dto.destinationHubId) {
      throw new BadRequestException('Hub nguồn và hub nhận phải khác nhau.');
    }
    return this.prisma.$transaction(async (tx) => {
      const [sourceHub, destinationHub, kit] = await Promise.all([
        tx.hub.findFirst({ where: { id: dto.hubId, active: true } }),
        tx.hub.findFirst({ where: { id: dto.destinationHubId, active: true } }),
        tx.kit.findFirst({
          where: { id: dto.kitId, active: true },
          include: { items: { include: { material: { select: { code: true, name: true, unit: true } } } } },
        }),
      ]);
      if (!sourceHub || !destinationHub) throw new BadRequestException('Hub nguồn hoặc hub nhận không hợp lệ.');
      if (!kit || kit.items.length === 0) throw new BadRequestException('KIT không tồn tại hoặc chưa có định mức vật tư.');

      const stocks = await tx.stock.findMany({
        where: { hubId: dto.hubId, materialId: { in: kit.items.map((item) => item.materialId) } },
      });

      const stockMap = new Map(stocks.map((stock) => [stock.materialId, Number(stock.quantity)]));
      const requirements = kit.items.map((item) => ({
        ...item,
        required: Number(item.quantity) * dto.kitQuantity,
        stock: stockMap.get(item.materialId) ?? 0,
      }));
      const shortages = requirements.filter((item) => item.stock < item.required);
      if (shortages.length) {
        const details = shortages.slice(0, 8).map((item) => `${item.material.code}: cần ${item.required}, tồn ${item.stock}`).join('; ');
        throw new BadRequestException(`Không đủ vật tư để chuyển ${dto.kitQuantity} ${kit.code}. Thiếu: ${details}.`);
      }

      for (const item of requirements) {
        await this.decrementStock(tx, dto.hubId, item.materialId, item.required);
        await this.incrementStock(tx, dto.destinationHubId, item.materialId, item.required);
      }
      return tx.stockTransaction.create({
        data: {
          transactionNo: this.transactionNo(TransactionType.KIT_TRANSFER),
          type: TransactionType.KIT_TRANSFER,
          hubId: dto.hubId,
          destinationHubId: dto.destinationHubId,
          kitId: kit.id,
          kitQuantity: dto.kitQuantity,
          transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
          counterparty: dto.counterparty?.trim() || null,
          note: dto.note?.trim() || null,
          createdById: userId,
          items: {
            create: requirements.map((item) => ({
              materialId: item.materialId,
              quantity: item.required,
              note: `${Number(item.quantity)} ${item.material.unit}/bộ × ${dto.kitQuantity} bộ`,
            })),
          },
        },
        include: { kit: true, hub: true, destinationHub: true, items: { include: { material: true } } },
      });
    });
  }

  async void(id: string, reason: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.stockTransaction.findUnique({ where: { id }, include: { items: true } });
      if (!transaction) throw new NotFoundException('Không tìm thấy phiếu kho.');
      if (transaction.status === 'VOID') throw new BadRequestException('Phiếu đã bị hủy trước đó.');

      if (transaction.type === 'IN') {
        for (const item of transaction.items) await this.decrementStock(tx, transaction.hubId, item.materialId, Number(item.quantity));
      } else if (transaction.type === 'OUT' || transaction.type === 'KIT_OUT') {
        for (const item of transaction.items) await this.incrementStock(tx, transaction.hubId, item.materialId, Number(item.quantity));
      } else if (transaction.type === 'TRANSFER' && transaction.destinationHubId) {
        for (const item of transaction.items) {
          await this.decrementStock(tx, transaction.destinationHubId, item.materialId, Number(item.quantity));
          await this.incrementStock(tx, transaction.hubId, item.materialId, Number(item.quantity));
        }
      } else if (transaction.type === 'KIT_TRANSFER' && transaction.destinationHubId && transaction.kitId && transaction.kitQuantity) {
        for (const item of transaction.items) {
          await this.decrementStock(tx, transaction.destinationHubId, item.materialId, Number(item.quantity));
          await this.incrementStock(tx, transaction.hubId, item.materialId, Number(item.quantity));
        }
      }

      return tx.stockTransaction.update({
        where: { id },
        data: { status: 'VOID', voidedAt: new Date(), voidedById: userId, voidReason: reason.trim() },
      });
    });
  }

  private incrementStock(tx: Prisma.TransactionClient, hubId: string, materialId: string, quantity: number) {
    return tx.stock.upsert({
      where: { hubId_materialId: { hubId, materialId } },
      update: { quantity: { increment: quantity } },
      create: { hubId, materialId, quantity },
    });
  }

  private async decrementStock(tx: Prisma.TransactionClient, hubId: string, materialId: string, quantity: number) {
    const result = await tx.stock.updateMany({
      where: { hubId, materialId, quantity: { gte: quantity } },
      data: { quantity: { decrement: quantity } },
    });
    if (result.count === 0) {
      const material = await tx.material.findUnique({ where: { id: materialId }, select: { code: true, name: true } });
      throw new BadRequestException(`Không đủ tồn kho cho ${material?.code ?? ''} ${material?.name ?? 'vật tư'}.`);
    }
  }

  private transactionNo(type: TransactionType) {
    const date = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const random = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `${type}-${date}-${random}`;
  }
}
