import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'brightchamps-warehouse-api', time: new Date().toISOString() };
  }
}
