import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUppercase,
  Length,
  Min,
} from 'class-validator';
import { UnidadMedida } from '@prisma/client';

export class CreateInsumoDto {
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
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  costoUnitarioActual?: number = 0;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  virtual?: boolean = false;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  estado?: boolean = true;
}

export class UpdateInsumoDto {
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
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  costoUnitarioActual?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  virtual?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  estado?: boolean;
}

export class ListInsumoQuery {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  virtual?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  estado?: boolean;

  @IsOptional()
  @IsEnum(UnidadMedida)
  unidad?: UnidadMedida;
}
