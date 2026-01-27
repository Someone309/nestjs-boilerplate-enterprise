import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, timeout, catchError, TimeoutError } from 'rxjs';
import { TIMEOUTS, ErrorCode } from '../constants';

/**
 * Timeout Interceptor
 * Order: 3 (Before) in request pipeline (Section 4.1)
 *
 * Default timeout: 30 seconds (Section 12.1)
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly timeoutMs: number;

  constructor(timeoutMs?: number) {
    this.timeoutMs = timeoutMs || TIMEOUTS.HTTP_REQUEST_MS;
  }

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(this.timeoutMs),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new RequestTimeoutException({
                code: ErrorCode.GATEWAY_TIMEOUT,
                message: 'Request timeout',
              }),
          );
        }
        return throwError(() => err as Error);
      }),
    );
  }
}
