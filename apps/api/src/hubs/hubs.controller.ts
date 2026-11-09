import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('hubs')
@UseGuards(JwtAuthGuard)
export class HubsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.hub.findMany({ where: { active: true }, orderBy: { code: 'asc' } });
  }
}
