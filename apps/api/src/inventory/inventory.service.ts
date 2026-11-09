import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(hubId?: string, search?: string, lowStock?: string) {
    const materialWhere: Prisma.MaterialWhereInput = { active: true };
    if (search?.trim()) {
      materialWhere.OR = [
        { code: { contains: search.trim(), mode: 'insensitive' } },
        { name: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [hubs, materials, stocks] = await Promise.all([
      this.prisma.hub.findMany({ where: hubId ? { id: hubId, active: true } : { active: true }, orderBy: { code: 'asc' } }),
      this.prisma.material.findMany({ where: materialWhere, orderBy: { code: 'asc' } }),
      this.prisma.stock.findMany({ where: hubId ? { hubId } : undefined }),
    ]);
    const stockMap = new Map(stocks.map((stock) => [`${stock.hubId}:${stock.materialId}`, Number(stock.quantity)]));
    const rows = hubs.flatMap((hub) =>
      materials.map((material) => {
        const quantity = stockMap.get(`${hub.id}:${material.id}`) ?? 0;
        const minimumStock = Number(material.minimumStock);
        const status = quantity <= 0 ? 'OUT_OF_STOCK' : quantity <= minimumStock ? 'LOW_STOCK' : 'IN_STOCK';
        return {
          hub: { id: hub.id, code: hub.code, name: hub.name },
          material: {
            id: material.id,
            code: material.code,
            name: material.name,
            category: material.category,
            unit: material.unit,
          },
          quantity,
          minimumStock,
          status,
        };
      }),
    );
    return lowStock === 'true' ? rows.filter((row) => row.status !== 'IN_STOCK') : rows;
  }
}
