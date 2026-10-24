import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'correo debe ser un email valido' })
  correo: string;

  @IsString()
  @MinLength(6, { message: 'password debe tener al menos 6 caracteres' })
  password: string;
}
