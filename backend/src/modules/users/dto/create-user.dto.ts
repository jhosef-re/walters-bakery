import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { Rol } from '@prisma/client';
import { ListUsersQuery } from '../../../common/dto/list-queries.dto';

export { ListUsersQuery };

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsEmail()
  correo: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Rol)
  rol: Rol;

  @IsOptional()
  @IsUUID()
  sucursalId?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol;

  @IsOptional()
  @IsUUID()
  sucursalId?: string | null;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  nuevaPassword: string;

  @IsOptional()
  @IsBoolean()
  debeCambiarPassword?: boolean;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  passwordActual: string;

  @IsString()
  @MinLength(6)
  passwordNueva: string;
}
