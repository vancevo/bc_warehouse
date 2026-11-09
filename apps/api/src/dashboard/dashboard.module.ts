import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { KitsModule } from '../kits/kits.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({ imports: [AuthModule, KitsModule], controllers: [DashboardController], providers: [DashboardService] })
export class DashboardModule {}
