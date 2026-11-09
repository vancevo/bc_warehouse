import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class KitsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.kit.findMany({
      where: { active: true },
      include: {
        items: {
          include: { material: { select: { id: true, code: true, name: true, unit: true } } },
          orderBy: { material: { code: 'asc' } },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async capacity(hubId?: string) {
    const [hubs, kits, stocks] = await Promise.all([
      this.prisma.hub.findMany({
        where: hubId ? { id: hubId, active: true } : { active: true },
        orderBy: { code: 'asc' },
      }),
      this.list(),
      this.prisma.stock.findMany({ where: hubId ? { hubId } : undefined }),
    ]);
    if (hubId && hubs.length === 0) throw new NotFoundException('Không tìm thấy hub.');

    const stockMap = new Map(stocks.map((stock) => [`${stock.hubId}:${stock.materialId}`, Number(stock.quantity)]));
    return hubs.map((hub) => ({
      hub: { id: hub.id, code: hub.code, name: hub.name },
      kits: kits.map((kit) => {
        const limits = kit.items.map((item) => {
          const stock = stockMap.get(`${hub.id}:${item.materialId}`) ?? 0;
          const perKit = Number(item.quantity);
          return {
            material: item.material,
            stock,
            perKit,
            possibleKits: Math.floor(stock / perKit),
          };
        });
        const maximum = limits.length ? Math.min(...limits.map((item) => item.possibleKits)) : 0;
        return {
          id: kit.id,
          code: kit.code,
          name: kit.name,
          maximum,
          limitingMaterials: limits.filter((item) => item.possibleKits === maximum),
        };
      }),
    }));
  }

  async summary(hubId?: string) {
    const [capacity, issued] = await Promise.all([
      this.capacity(hubId),
      this.prisma.stockTransaction.groupBy({
        by: ['hubId', 'kitId'],
        where: {
          type: 'KIT_OUT',
          status: 'POSTED',
          ...(hubId && { hubId }),
          kitId: { not: null },
        },
        _sum: { kitQuantity: true },
      }),
    ]);
    const issuedMap = new Map(issued.map((row) => [`${row.hubId}:${row.kitId}`, row._sum.kitQuantity ?? 0]));
    return capacity.map((hub) => ({
      hub: hub.hub,
      kits: hub.kits.map((kit) => {
        const key = `${hub.hub.id}:${kit.id}`;
        const issuedQuantity = issuedMap.get(key) ?? 0;
        return {
          ...kit,
          issuedQuantity,
        };
      }),
    }));
  }
}
