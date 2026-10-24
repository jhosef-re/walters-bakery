import {
  Body,
  Controller,
  Delete,
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
import { ListInsumosQuery } from '../../../common/dto/list-queries.dto';
import { InsumoService } from './insumo.service';
import {
  CreateInsumoDto,
  UpdateInsumoDto,
} from './dto/insumo.dto';

@Controller('catalog/insumos')
@UseGuards(JwtAuthGuard)
export class InsumoController {
  constructor(private readonly svc: InsumoService) {}

  @Get()
  findAll(@Query() q: ListInsumosQuery) {
    return this.svc.findAll(q);
  }

  @Get(':id')
  findOne(@Param() p: IdParamDto) {
    return this.svc.findByIdOrThrow(p.id);
  }

  @Post()
  @Roles(Rol.administrador_general)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateInsumoDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @Roles(Rol.administrador_general)
  update(@Param() p: IdParamDto, @Body() dto: UpdateInsumoDto) {
    return this.svc.update(p.id, dto);
  }

  @Delete(':id')
  @Roles(Rol.administrador_general)
  archivar(@Param() p: IdParamDto) {
    return this.svc.archivar(p.id);
  }
}
