import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUppercase,
  Length,
  Max,
  Min,
} from 'class-validator';
import { TipoReuso, UnidadMedida } from '@prisma/client';

export class CreateProductoTerminadoDto {
  @IsString()
  @Length(2, 50)
  @IsUppercase({ message: 'SKU debe estar en MAYUSCULAS' })
  sku: string;

  @IsString()
  @Length(2, 100)
  nombre: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  descripcion?: string;

  @IsEnum(UnidadMedida)
  unidad: UnidadMedida;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  vidaUtilDias?: number = 1;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  precioVenta: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  reutilizable?: boolean = false;

  @IsOptional()
  @IsEnum(TipoReuso)
  tipoReuso?: TipoReuso = TipoReuso.none;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  estado?: boolean = true;
}

export class UpdateProductoTerminadoDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  nombre?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  descripcion?: string;

  @IsOptional()
  @IsEnum(UnidadMedida)
  unidad?: UnidadMedida;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  vidaUtilDias?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  precioVenta?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  reutilizable?: boolean;

  @IsOptional()
  @IsEnum(TipoReuso)
  tipoReuso?: TipoReuso;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  estado?: boolean;
}

export class ListProductoQuery {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  reutilizables?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  estado?: boolean;

  @IsOptional()
  @IsEnum(UnidadMedida)
  unidad?: UnidadMedida;
}
