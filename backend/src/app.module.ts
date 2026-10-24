import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';

import { PrismaModule } from './prisma/prisma.module';
import { validateEnv } from './config/env.schema';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { CatalogModule } from './modules/catalog/catalog.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { UsersModule } from './modules/users/users.module';
import { ProductionModule } from './modules/production/production.module';
import { ClosuresModule } from './modules/closures/closures.module';
import { TransfersModule } from './modules/transfers/transfers.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { WasteModule } from './modules/waste/waste.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthController } from './health.controller';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      cache: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } }
            : undefined,
        redact: ['req.headers.cookie', 'req.headers.authorization', '*.password', '*.passwordHash'],
        autoLogging: true,
        customLogLevel: (req, res, err) => {
          if (err || res.statusCode >= 500) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
      },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    AuthModule,
    CatalogModule,
    RecipesModule,
    ProductionModule,
    ClosuresModule,
    TransfersModule,
    InventoryModule,
    WasteModule,
    AlertsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
