import { Module } from '@nestjs/common';
import { SucursalService } from './sucursal.service';
import { SucursalController } from './sucursal.controller';

@Module({
  controllers: [SucursalController],
  providers: [SucursalService],
  exports: [SucursalService],
})
export class SucursalModule {}
