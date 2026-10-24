import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

export type NodeEnv = 'development' | 'production' | 'test';

export class EnvSchema {
  @IsEnum(['development', 'production', 'test'])
  NODE_ENV: NodeEnv = 'development';

  @IsNumberString()
  PORT: string = '3000';

  @IsString()
  CORS_ORIGIN: string = 'http://localhost:5173';

  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  @IsString()
  @MinLength(16, { message: 'JWT_ACCESS_SECRET debe tener al menos 16 caracteres' })
  JWT_ACCESS_SECRET!: string;

  @IsString()
  JWT_ACCESS_TTL: string = '15m';

  @IsString()
  @MinLength(16, { message: 'JWT_REFRESH_SECRET debe tener al menos 16 caracteres' })
  JWT_REFRESH_SECRET!: string;

  @IsString()
  JWT_REFRESH_TTL: string = '7d';

  @IsOptional()
  @IsString()
  REDIS_HOST?: string = 'localhost';

  @IsOptional()
  @IsNumberString()
  REDIS_PORT?: string = '6379';

  @IsOptional()
  @IsString()
  SMTP_HOST?: string = 'localhost';

  @IsOptional()
  @IsNumberString()
  SMTP_PORT?: string = '1025';

  @IsOptional()
  @IsString()
  SMTP_USER?: string = '';

  @IsOptional()
  @IsString()
  SMTP_PASS?: string = '';

  @IsOptional()
  @IsString()
  SMTP_FROM?: string = 'Walters Bakery <no-reply@walters.local>';

  @IsOptional()
  @IsString()
  JOB_VENCIMIENTO_OFFSET_MINUTOS?: string = '60';

  @IsOptional()
  @IsString()
  JOB_VENCIMIENTO_TICK_CRON?: string = '*/5 * * * *';
}

export function validateEnv(rawConfig: Record<string, unknown>): EnvSchema {
  const validated = plainToInstance(EnvSchema, rawConfig, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
    forbidNonWhitelisted: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((err) => {
        const constraints = err.constraints
          ? Object.values(err.constraints).join(', ')
          : 'invalid';
        return `  - ${err.property}: ${constraints}`;
      })
      .join('\n');
    throw new Error(
      `Configuracion de entorno invalida. Revisa las siguientes variables:\n${messages}`,
    );
  }

  return validated;
}
