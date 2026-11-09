import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listUsers(status?: UserStatus) {
    return this.prisma.user.findMany({
      where: status ? { status } : undefined,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(userId: string, reviewerId: string, role: Role) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản.');
    if (user.status === 'APPROVED') throw new BadRequestException('Tài khoản đã được duyệt.');
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'APPROVED', role, reviewedById: reviewerId, reviewedAt: new Date() },
      select: { id: true, email: true, fullName: true, role: true, status: true },
    });
  }

  async updateStatus(userId: string, reviewerId: string, status: UserStatus) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản.');
    if (userId === reviewerId && status !== 'APPROVED') {
      throw new BadRequestException('Admin không thể tự khóa hoặc từ chối chính mình.');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { status, reviewedById: reviewerId, reviewedAt: new Date() },
      select: { id: true, email: true, fullName: true, role: true, status: true },
    });
  }
}
