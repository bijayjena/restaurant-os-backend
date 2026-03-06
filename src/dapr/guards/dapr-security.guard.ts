import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { DaprSecurityService } from '../services/dapr-security.service';
import { Request } from 'express';

@Injectable()
export class DaprSecurityGuard implements CanActivate {
  constructor(private readonly daprSecurityService: DaprSecurityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Verify request signature if present
    const signature = request.headers['x-signature'] as string;
    const timestamp = request.headers['x-timestamp'] as string;
    
    if (signature && timestamp) {
      const isValid = this.verifyRequestSignature(request, signature, timestamp);
      if (!isValid) {
        throw new UnauthorizedException('Invalid request signature');
      }
    }
    
    // Check rate limit
    const identifier = this.getClientIdentifier(request);
    const isAllowed = this.daprSecurityService.checkRateLimit(identifier);
    
    if (!isAllowed) {
      throw new UnauthorizedException('Rate limit exceeded');
    }
    
    return true;
  }

  private verifyRequestSignature(request: Request, signature: string, timestamp: string): boolean {
    // Check timestamp to prevent replay attacks (5 minutes window)
    const now = Date.now();
    const requestTime = parseInt(timestamp, 10);
    
    if (Math.abs(now - requestTime) > 300000) {
      return false;
    }
    
    // Verify signature
    const secret = process.env.REQUEST_SIGNATURE_SECRET || 'default-secret';
    const data = `${request.method}:${request.url}:${timestamp}`;
    
    return this.daprSecurityService.verifyHMAC(data, signature, secret);
  }

  private getClientIdentifier(request: Request): string {
    // Use IP address or API key as identifier
    const apiKey = request.headers['x-api-key'] as string;
    if (apiKey) {
      return `api:${apiKey}`;
    }
    
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    return `ip:${ip}`;
  }
}
