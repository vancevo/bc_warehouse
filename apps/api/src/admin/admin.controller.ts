import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import { AuthUser } from '../common/auth.types';
import { CurrentUser } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';
import { ApproveUserDto, UpdateUserStatusDto } from './admin.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get()
  list(@Query('status') status?: UserStatus) {
    return this.admin.listUsers(status);
  }

  @Get('pending')
  pending() {
    return this.admin.listUsers(UserStatus.PENDING);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: ApproveUserDto) {
    return this.admin.approve(id, user.id, dto.role);
  }

  @Patch(':id/status')
  status(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateUserStatusDto) {
    return this.admin.updateStatus(id, user.id, dto.status);
  }
}
