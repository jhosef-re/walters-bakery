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
import { ListProductosQuery } from '../../../common/dto/list-queries.dto';
import { ProductoService } from './producto.service';
import {
  CreateProductoTerminadoDto,
  UpdateProductoTerminadoDto,
} from './dto/producto.dto';

@Controller('catalog/productos')
@UseGuards(JwtAuthGuard)
export class ProductoController {
  constructor(private readonly svc: ProductoService) {}

  @Get()
  findAll(@Query() q: ListProductosQuery) {
    return this.svc.findAll(q);
  }

  @Get('reutilizables')
  reutilizables(@Query() q: ListProductosQuery) {
    return this.svc.findAll({ ...q, reutilizables: true });
  }

  @Get(':id')
  findOne(@Param() p: IdParamDto) {
    return this.svc.findByIdOrThrow(p.id);
  }

  @Post()
  @Roles(Rol.administrador_general)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductoTerminadoDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @Roles(Rol.administrador_general)
  update(@Param() p: IdParamDto, @Body() dto: UpdateProductoTerminadoDto) {
    return this.svc.update(p.id, dto);
  }

  @Delete(':id')
  @Roles(Rol.administrador_general)
  archivar(@Param() p: IdParamDto) {
    return this.svc.archivar(p.id);
  }
}
