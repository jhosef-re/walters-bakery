import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationDto } from './pagination.dto';
import { UnidadMedida } from '@prisma/client';

export class ListProductosQuery extends PaginationDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  reutilizables?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  estado?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['pieza', 'kg', 'lt', 'paquete'])
  unidad?: UnidadMedida;
}

export class ListInsumosQuery extends PaginationDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  virtual?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  estado?: boolean;
}

export class ListSucursalesQuery extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsIn(['central', 'punto_venta'])
  tipo?: 'central' | 'punto_venta';

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  estado?: boolean;
}

export class ListUsersQuery extends PaginationDto {
  // usa search de PaginationDto
}

export class UpsertRecetaDetalleDto {
  @IsUUID()
  insumoId: string;

  @IsOptional()
  @Type(() => Number)
  cantidad?: number;

  @IsString()
  unidad: UnidadMedida;
}
