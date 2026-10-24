import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Rol } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { IdParamDto } from '../../../common/dto/id-param.dto';
import { ConfiguracionMermaService } from './config-merma.service';
import {
  CreateConfiguracionMermaDto,
  ResolveUmbralQuery,
  UpdateConfiguracionMermaDto,
} from './dto/config-merma.dto';

@Controller('catalog/configuracion-merma')
@UseGuards(JwtAuthGuard)
export class ConfiguracionMermaController {
  constructor(private readonly svc: ConfiguracionMermaService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Get('umbral')
  resolve(@Query() q: ResolveUmbralQuery) {
    return this.svc.resolveThreshold(q.productoId, q.insumoId);
  }

  @Post()
  @Roles(Rol.administrador_general)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateConfiguracionMermaDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @Roles(Rol.administrador_general)
  update(@Param() p: IdParamDto, @Body() dto: UpdateConfiguracionMermaDto) {
    return this.svc.update(p.id, dto);
  }
}
