import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import {
  AppException,
  codeForStatus,
  statusForException,
} from '../exceptions/index';

interface ErrorBody {
  statusCode: number;
  code: string;
  message: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const body = this.buildBody(exception);
    if (body.statusCode >= 500) {
      this.logUnexpected(exception);
    }
    const httpContext = host.switchToHttp();
    const response = httpContext.getResponse();
    this.httpAdapterHost.httpAdapter.reply(response, body, body.statusCode);
  }

  private buildBody(exception: unknown): ErrorBody {
    if (exception instanceof AppException) {
      const status = statusForException(exception);
      return {
        statusCode: status,
        code: exception.code,
        message: exception.message,
      };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        statusCode: status,
        code: this.codeFromHttpException(exception, status),
        message: this.messageFromHttpException(exception),
      };
    }
    return {
      statusCode: 500,
      code: 'internal_error',
      message: 'Something went wrong on the server. Please try again.',
    };
  }

  private codeFromHttpException(
    exception: HttpException,
    status: number,
  ): string {
    const payload: unknown = exception.getResponse();
    if (typeof payload === 'object' && payload !== null) {
      const record = payload as Record<string, unknown>;
      if (typeof record.code === 'string') {
        return record.code;
      }
    }
    return codeForStatus(status);
  }

  private messageFromHttpException(exception: HttpException): string {
    const payload: unknown = exception.getResponse();
    if (typeof payload === 'string') {
      return payload;
    }
    if (typeof payload !== 'object' || payload === null) {
      return 'The request could not be processed.';
    }
    const record = payload as Record<string, unknown>;
    const message = record.message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message)) {
      const parts = message.filter(
        (item): item is string => typeof item === 'string',
      );
      if (parts.length > 0) {
        return parts.join(' ');
      }
    }
    return 'The request could not be processed.';
  }

  private logUnexpected(exception: unknown): void {
    if (exception instanceof Error) {
      this.logger.error(
        `${exception.name}: ${exception.message}`,
        exception.stack,
      );
      return;
    }
    this.logger.error('An unknown error was thrown by the server.');
  }
}
