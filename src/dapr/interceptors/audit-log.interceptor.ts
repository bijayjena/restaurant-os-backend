import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { DaprSecurityService } from '../services/dapr-security.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  constructor(private readonly daprSecurityService: DaprSecurityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip, headers } = request;
    const user = (request as any).user;
    const now = Date.now();

    // Log sensitive operations
    const sensitiveOperations = ['POST', 'PUT', 'PATCH', 'DELETE'];
    
    if (sensitiveOperations.includes(method)) {
      this.logger.log(
        `[AUDIT] ${method} ${url} - User: ${user?.email || 'Anonymous'} - IP: ${ip} - UserAgent: ${headers['user-agent']}`,
      );
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const delay = Date.now() - now;
          
          // Log successful sensitive operations
          if (sensitiveOperations.includes(method)) {
            this.logger.log(
              `[AUDIT SUCCESS] ${method} ${url} - User: ${user?.email || 'Anonymous'} - ${delay}ms`,
            );
          }
        },
        error: (error) => {
          const delay = Date.now() - now;
          
          // Log failed operations
          this.logger.error(
            `[AUDIT FAILURE] ${method} ${url} - User: ${user?.email || 'Anonymous'} - Error: ${error.message} - ${delay}ms`,
          );
        },
      }),
    );
  }
}
