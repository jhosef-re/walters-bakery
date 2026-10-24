import { Module } from '@nestjs/common';
import { ConfiguracionMermaService } from './config-merma.service';
import { ConfiguracionMermaController } from './config-merma.controller';

@Module({
  controllers: [ConfiguracionMermaController],
  providers: [ConfiguracionMermaService],
  exports: [ConfiguracionMermaService],
})
export class ConfiguracionMermaModule {}
