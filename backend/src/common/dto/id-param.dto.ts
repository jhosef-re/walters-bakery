import { IsUUID } from 'class-validator';

export class IdParamDto {
  @IsUUID('4', { message: 'id debe ser un UUID v4 valido' })
  id: string;
}
