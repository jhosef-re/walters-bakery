import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { UnidadMedida } from '@prisma/client';

export class RecetaDetalleInput {
  @IsUUID()
  insumoId: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  cantidad: number;

  @IsEnum(UnidadMedida)
  unidad: UnidadMedida;
}

export class CreateRecetaDto {
  @IsUUID()
  productoTerminadoId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecetaDetalleInput)
  detalle: RecetaDetalleInput[];
}

export class CloneRecetaDto {
  @IsOptional()
  @IsString()
  motivo?: string;
}

export class UpsertRecetaDetalleDto extends CreateRecetaDto {}
