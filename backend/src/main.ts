import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(PinoLogger));

  const config = app.get(ConfigService);
  const port = Number(config.get<string>('PORT') ?? 3000);
  const corsOrigin = config.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173';
  const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';

  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.setGlobalPrefix('api');

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Walters Bakery API')
      .setDescription(
        'API REST del sistema de control de inventario, producción, mermas y cierres de venta para panadería multi-sucursal.',
      )
      .setVersion('0.1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'jwt-access')
      .addCookieAuth('rt', { type: 'apiKey', in: 'cookie' }, 'jwt-refresh')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port);
  Logger.log(
    `Walters Bakery API corriendo en http://localhost:${port}/api`,
    'Bootstrap',
  );
}

bootstrap();
