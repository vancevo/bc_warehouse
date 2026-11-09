import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { KitsService } from './kits.service';

@Controller('kits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KitsController {
  constructor(private readonly kits: KitsService) {}

  @Get()
  list() {
    return this.kits.list();
  }

  @Get('capacity')
  capacity(@Query('hubId') hubId?: string) {
    return this.kits.capacity(hubId);
  }

  @Get('summary')
  summary(@Query('hubId') hubId?: string) {
    return this.kits.summary(hubId);
  }
}
