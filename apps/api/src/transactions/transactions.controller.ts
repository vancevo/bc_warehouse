import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role, TransactionType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../common/auth.types';
import { CurrentUser } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CreateKitOutDto, CreateKitTransferDto, CreateTransactionDto, VoidTransactionDto } from './transactions.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  list(
    @Query('hubId') hubId?: string,
    @Query('type') type?: TransactionType,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.transactions.list({ hubId, type, from, to });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.transactions.get(id);
  }

  @Post('in')
  @Roles(Role.ADMIN, Role.STAFF)
  createIn(@Body() dto: CreateTransactionDto, @CurrentUser() user: AuthUser) {
    return this.transactions.create(TransactionType.IN, dto, user.id);
  }

  @Post('out')
  @Roles(Role.ADMIN, Role.STAFF)
  createOut(@Body() dto: CreateTransactionDto, @CurrentUser() user: AuthUser) {
    return this.transactions.create(TransactionType.OUT, dto, user.id);
  }

  @Post('kit-out')
  @Roles(Role.ADMIN, Role.STAFF)
  createKitOut(@Body() dto: CreateKitOutDto, @CurrentUser() user: AuthUser) {
    return this.transactions.createKitOut(dto, user.id);
  }

  @Post('kit-transfer')
  @Roles(Role.ADMIN, Role.STAFF)
  createKitTransfer(@Body() dto: CreateKitTransferDto, @CurrentUser() user: AuthUser) {
    return this.transactions.createKitTransfer(dto, user.id);
  }

  @Post('transfer')
  @Roles(Role.ADMIN, Role.STAFF)
  transfer(@Body() dto: CreateTransactionDto, @CurrentUser() user: AuthUser) {
    return this.transactions.create(TransactionType.TRANSFER, dto, user.id);
  }

  @Post(':id/void')
  @Roles(Role.ADMIN)
  void(@Param('id') id: string, @Body() dto: VoidTransactionDto, @CurrentUser() user: AuthUser) {
    return this.transactions.void(id, dto.reason, user.id);
  }
}
