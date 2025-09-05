import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? (exception as HttpException).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Normalize message
    let message: string | string[] = 'Internal server error';
    let errorName: string | undefined;
    if (isHttp) {
      const resp = (exception as HttpException).getResponse();
      if (typeof resp === 'string') {
        message = resp;
      } else if (resp && typeof resp === 'object') {
        // Nest default ValidationPipe may set { message: string | string[], error: 'Bad Request' }
        const obj = resp as any;
        message = obj.message ?? obj.error ?? (exception as any)?.message ?? 'Error';
        errorName = obj.error;
      }
    } else {
      message = (exception as any)?.message || 'Internal server error';
      errorName = (exception as any)?.name;
    }

    const stack = (exception as any)?.stack;
    const method = request?.method;
    const url = request?.originalUrl || request?.url;

    const safeMessage = Array.isArray(message)
      ? message
      : typeof message === 'string'
        ? message
        : JSON.stringify(message);

    this.logger.error(`Unhandled exception for ${method} ${url}: ${safeMessage}`);
    if (stack) {
      this.logger.error(stack);
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: url,
      method,
      message: safeMessage,
      error: errorName,
    };

    if (response && typeof response.status === 'function') {
      response.status(status).json(errorResponse);
    }
  }
}
