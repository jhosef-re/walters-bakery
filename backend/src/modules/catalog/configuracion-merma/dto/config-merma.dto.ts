import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateConfiguracionMermaDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  umbral: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  defaultGeneral?: boolean = false;

  @IsOptional()
  @IsUUID()
  productoTerminadoId?: string;

  @IsOptional()
  @IsUUID()
  insumoId?: string;
}

export class UpdateConfiguracionMermaDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  umbral?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  defaultGeneral?: boolean;
}

export class ResolveUmbralQuery {
  @IsOptional()
  @IsUUID()
  productoId?: string;

  @IsOptional()
  @IsUUID()
  insumoId?: string;
}
