import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateTurnoDto {
  @IsString()
  nombre: string;

  @IsString()
  @Matches(HHMM, { message: 'horaInicio debe tener formato HH:mm' })
  horaInicio: string;

  @IsString()
  @Matches(HHMM, { message: 'horaFin debe tener formato HH:mm' })
  horaFin: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  cruzaMedianoche?: boolean = false;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  orden?: number;
}

export class UpdateTurnoDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  @Matches(HHMM, { message: 'horaInicio debe tener formato HH:mm' })
  horaInicio?: string;

  @IsOptional()
  @IsString()
  @Matches(HHMM, { message: 'horaFin debe tener formato HH:mm' })
  horaFin?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  cruzaMedianoche?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  orden?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  estado?: boolean;
}
