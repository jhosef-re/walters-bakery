import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawPayload =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const message =
      typeof rawPayload === 'string'
        ? rawPayload
        : Array.isArray((rawPayload as { message?: unknown }).message)
          ? ((rawPayload as { message: string[] }).message)
          : ((rawPayload as { message?: string }).message ?? 'Error');

    const errorName =
      typeof rawPayload === 'object' && rawPayload !== null && 'error' in rawPayload
        ? String((rawPayload as { error: unknown }).error)
        : HttpStatus[status];

    if (status >= 500) {
      const stack =
        exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(
        `${request.method} ${request.url} -> ${status} ${HttpStatus[status]}`,
        stack,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} -> ${status} ${HttpStatus[status]}`,
      );
    }

    const body: ErrorResponseBody = {
      statusCode: status,
      error: errorName,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }
}
