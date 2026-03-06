import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DaprClient } from '@dapr/dapr';
import * as crypto from 'crypto';

@Injectable()
export class DaprSecurityService implements OnModuleInit {
  private readonly logger = new Logger(DaprSecurityService.name);
  private daprClient: DaprClient;
  private readonly useDapr = process.env.USE_DAPR === 'true';

  async onModuleInit() {
    if (this.useDapr) {
      try {
        this.daprClient = new DaprClient({
          daprHost: process.env.DAPR_HOST || '127.0.0.1',
          daprPort: process.env.DAPR_HTTP_PORT || '3500',
        });
        this.logger.log('Dapr Security Service initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Dapr client', error);
      }
    }
  }

  /**
   * Encrypt sensitive data using Dapr crypto
   */
  async encryptData(data: string, algorithm: string = 'aes-256-gcm'): Promise<string> {
    try {
      // Generate encryption key
      const key = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = (cipher as any).getAuthTag();
      
      // Combine iv, authTag, and encrypted data
      const result = {
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        encrypted,
        algorithm,
      };
      
      return Buffer.from(JSON.stringify(result)).toString('base64');
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedData: string, key: Buffer): Promise<string> {
    try {
      const data = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));
      
      const decipher = crypto.createDecipheriv(
        data.algorithm,
        key,
        Buffer.from(data.iv, 'hex'),
      );
      
      (decipher as any).setAuthTag(Buffer.from(data.authTag, 'hex'));
      
      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw error;
    }
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash sensitive data (one-way)
   */
  hashData(data: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * Verify data integrity using HMAC
   */
  generateHMAC(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  verifyHMAC(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Sanitize input to prevent injection attacks
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .trim();
  }

  /**
   * Validate IP address
   */
  isValidIP(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Rate limit check (simple in-memory implementation)
   */
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.rateLimitMap.get(identifier);

    if (!record || now > record.resetTime) {
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Generate API key
   */
  generateAPIKey(): string {
    const prefix = 'rsk'; // Restaurant Secret Key
    const randomPart = crypto.randomBytes(24).toString('base64url');
    return `${prefix}_${randomPart}`;
  }

  /**
   * Mask sensitive data for logging
   */
  maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars) {
      return '*'.repeat(data.length);
    }
    return data.substring(0, visibleChars) + '*'.repeat(data.length - visibleChars);
  }
}
