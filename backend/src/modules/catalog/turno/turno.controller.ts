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
  UseGuards,
} from '@nestjs/common';
import { Rol } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { IdParamDto } from '../../../common/dto/id-param.dto';
import { TurnoService } from './turno.service';
import { CreateTurnoDto, UpdateTurnoDto } from './dto/turno.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class TurnoController {
  constructor(private readonly svc: TurnoService) {}

  @Get('catalog/sucursales/:id/turnos')
  listBySucursal(@Param('id') sucursalId: string) {
    return this.svc.findBySucursal(sucursalId, true);
  }

  @Post('catalog/sucursales/:id/turnos')
  @Roles(Rol.administrador_general, Rol.gerente_sucursal)
  @HttpCode(HttpStatus.CREATED)
  create(@Param('id') sucursalId: string, @Body() dto: CreateTurnoDto) {
    return this.svc.create(sucursalId, dto);
  }

  @Get('catalog/turnos/:id')
  findOne(@Param() p: IdParamDto) {
    return this.svc.findByIdOrThrow(p.id);
  }

  @Patch('catalog/turnos/:id')
  @Roles(Rol.administrador_general, Rol.gerente_sucursal)
  update(@Param() p: IdParamDto, @Body() dto: UpdateTurnoDto) {
    return this.svc.update(p.id, dto);
  }

  @Delete('catalog/turnos/:id')
  @Roles(Rol.administrador_general, Rol.gerente_sucursal)
  archivar(@Param() p: IdParamDto) {
    return this.svc.archivar(p.id);
  }
}
