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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { RecipesService } from './recipes.service';
import {
  CloneRecetaDto,
  CreateRecetaDto,
} from './dto/create-recipe.dto';
import { UpdateRecetaDto } from './dto/update-recipe.dto';
import { IdParamDto } from '../../common/dto/id-param.dto';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(private readonly svc: RecipesService) {}

  @Get()
  list(@Query('productoId') productoId?: string) {
    if (productoId) {
      return this.svc.findByProducto(productoId);
    }
    return this.svc.findAll();
  }

  @Get('vigente')
  vigenteFor(@Query() q: { productoId: string }) {
    if (!q.productoId) {
      return this.svc.findAll();
    }
    return this.svc.findVigente(q.productoId);
  }

  @Get(':id')
  findOne(@Param() p: IdParamDto) {
    return this.svc.findByIdOrThrow(p.id);
  }

  @Post()
  @Roles(Rol.administrador_general)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRecetaDto) {
    return this.svc.create(dto);
  }

  @Post(':id/clone')
  @Roles(Rol.administrador_general)
  @HttpCode(HttpStatus.CREATED)
  clone(@Param() p: IdParamDto, @Body() dto: CloneRecetaDto) {
    return this.svc.clone(p.id, dto);
  }

  @Patch(':id')
  @Roles(Rol.administrador_general)
  update(@Param() p: IdParamDto, @Body() dto: UpdateRecetaDto) {
    return this.svc.update(p.id, dto);
  }
}
