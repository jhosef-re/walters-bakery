import { Module } from '@nestjs/common';
import { SucursalModule } from './sucursal/sucursal.module';
import { ProductoModule } from './producto/producto.module';
import { InsumoModule } from './insumo/insumo.module';
import { TurnoModule } from './turno/turno.module';
import { ConfiguracionMermaModule } from './configuracion-merma/config-merma.module';

@Module({
  imports: [
    SucursalModule,
    ProductoModule,
    InsumoModule,
    TurnoModule,
    ConfiguracionMermaModule,
  ],
})
export class CatalogModule {}
