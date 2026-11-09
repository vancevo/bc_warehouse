import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExportsService } from './exports.service';

@Controller('exports')
@UseGuards(JwtAuthGuard)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('inventory.csv')
  async inventory(@Query('hubId') hubId: string | undefined, @Res() response: Response) {
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="inventory.csv"');
    response.send(await this.exportsService.inventoryCsv(hubId));
  }

  @Get('transactions.csv')
  async transactions(@Query('hubId') hubId: string | undefined, @Res() response: Response) {
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    response.send(await this.exportsService.transactionsCsv(hubId));
  }
}
