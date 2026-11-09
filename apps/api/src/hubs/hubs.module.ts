import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HubsController } from './hubs.controller';

@Module({ imports: [AuthModule], controllers: [HubsController] })
export class HubsModule {}
