import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { KitsService } from '../kits/kits.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kits: KitsService,
  ) {}

  async summary() {
    const [hubs, materials, stocks, pendingUsers, recentTransactions, kitSummary] = await Promise.all([
      this.prisma.hub.findMany({ where: { active: true }, orderBy: { code: 'asc' } }),
      this.prisma.material.findMany({ where: { active: true }, select: { id: true, minimumStock: true } }),
      this.prisma.stock.findMany(),
      this.prisma.user.count({ where: { status: 'PENDING' } }),
      this.prisma.stockTransaction.findMany({
        take: 8,
        orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          hub: { select: { code: true } },
          destinationHub: { select: { code: true } },
          kit: { select: { code: true, name: true } },
          createdBy: { select: { fullName: true } },
          _count: { select: { items: true } },
        },
      }),
      this.kits.summary(),
    ]);

    const stockMap = new Map(stocks.map((stock) => [`${stock.hubId}:${stock.materialId}`, Number(stock.quantity)]));
    const hubSummary = hubs.map((hub) => {
      let outOfStock = 0;
      let lowStock = 0;
      let stockedMaterials = 0;
      for (const material of materials) {
        const quantity = stockMap.get(`${hub.id}:${material.id}`) ?? 0;
        if (quantity <= 0) outOfStock += 1;
        else {
          stockedMaterials += 1;
          if (quantity <= Number(material.minimumStock)) lowStock += 1;
        }
      }
      return { hubId: hub.id, code: hub.code, name: hub.name, stockedMaterials, lowStock, outOfStock };
    });

    return {
      totalMaterials: materials.length,
      totalHubs: hubs.length,
      pendingUsers,
      hubSummary,
      kitSummary,
      recentTransactions,
    };
  }
}
