import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { KitsController } from './kits.controller';
import { KitsService } from './kits.service';
import { RolesGuard } from '../common/roles.guard';

@Module({
  imports: [AuthModule],
  controllers: [KitsController],
  providers: [KitsService, RolesGuard],
  exports: [KitsService],
})
export class KitsModule {}
