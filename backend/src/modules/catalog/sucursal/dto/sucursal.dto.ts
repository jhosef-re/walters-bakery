import { IsBoolean, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoSucursal } from '@prisma/client';

export class CreateSucursalDto {
  @IsString()
  @Length(2, 100)
  nombre: string;

  @IsString()
  @Length(1, 20)
  codigo: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsEnum(TipoSucursal)
  tipo: TipoSucursal;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  estado?: boolean = true;
}

export class UpdateSucursalDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  nombre?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsEnum(TipoSucursal)
  tipo?: TipoSucursal;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  estado?: boolean;
}

export class ListSucursalQuery {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TipoSucursal)
  tipo?: TipoSucursal;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  estado?: boolean;
}
