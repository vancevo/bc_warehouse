import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { CreateMaterialDto, UpdateMaterialDto } from './materials.dto';

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  list(search?: string, category?: string, active?: string) {
    const where: Prisma.MaterialWhereInput = {};
    if (search?.trim()) {
      where.OR = [
        { code: { contains: search.trim(), mode: 'insensitive' } },
        { name: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (active === 'true' || active === 'false') where.active = active === 'true';
    return this.prisma.material.findMany({ where, orderBy: [{ code: 'asc' }] });
  }

  async get(id: string) {
    const material = await this.prisma.material.findUnique({ where: { id } });
    if (!material) throw new NotFoundException('Không tìm thấy vật tư.');
    return material;
  }

  async create(dto: CreateMaterialDto) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.material.findUnique({ where: { code } });
    if (existing) throw new BadRequestException('Mã vật tư đã tồn tại.');
    return this.prisma.material.create({
      data: {
        code,
        name: dto.name.trim(),
        category: dto.category.trim(),
        unit: dto.unit.trim(),
        minimumStock: dto.minimumStock ?? 0,
        note: dto.note?.trim() || null,
      },
    });
  }

  async update(id: string, dto: UpdateMaterialDto) {
    await this.get(id);
    return this.prisma.material.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.category !== undefined && { category: dto.category.trim() }),
        ...(dto.unit !== undefined && { unit: dto.unit.trim() }),
        ...(dto.minimumStock !== undefined && { minimumStock: dto.minimumStock }),
        ...(dto.note !== undefined && { note: dto.note.trim() || null }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });
  }
}
