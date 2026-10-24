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
import { ListSucursalesQuery } from '../../../common/dto/list-queries.dto';
import { SucursalService } from './sucursal.service';
import {
  CreateSucursalDto,
  UpdateSucursalDto,
} from './dto/sucursal.dto';

@Controller('catalog/sucursales')
@UseGuards(JwtAuthGuard)
export class SucursalController {
  constructor(private readonly svc: SucursalService) {}

  @Get()
  findAll(@Query() q: ListSucursalesQuery) {
    return this.svc.findAll(q);
  }

  @Get(':id')
  findOne(@Param() p: IdParamDto) {
    return this.svc.findByIdOrThrow(p.id);
  }

  @Post()
  @Roles(Rol.administrador_general)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSucursalDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @Roles(Rol.administrador_general)
  update(@Param() p: IdParamDto, @Body() dto: UpdateSucursalDto) {
    return this.svc.update(p.id, dto);
  }

  @Delete(':id')
  @Roles(Rol.administrador_general)
  archivar(@Param() p: IdParamDto) {
    return this.svc.archivar(p.id);
  }
}
