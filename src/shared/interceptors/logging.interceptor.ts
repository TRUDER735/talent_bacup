import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req?.method;
    const url = req?.originalUrl || req?.url;
    const start = Date.now();

    this.logger.log(`➡️  ${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log(`⬅️  ${method} ${url} (${duration}ms)`);
      }),
      catchError((err) => {
        const duration = Date.now() - start;
        this.logger.error(`❌ ${method} ${url} failed after ${duration}ms: ${err?.message || err}`);
        throw err;
      }),
    );
  }
}
