import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'walters-bakery-api',
      timestamp: new Date().toISOString(),
    };
  }
}
