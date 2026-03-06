import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DaprClient } from '@dapr/dapr';

@Injectable()
export class DaprConfigService implements OnModuleInit {
  private readonly logger = new Logger(DaprConfigService.name);
  private daprClient: DaprClient;
  private readonly configStoreName = process.env.DAPR_CONFIG_STORE || 'local-config-store';
  private readonly useDapr = process.env.USE_DAPR === 'true';
  private configCache: Map<string, any> = new Map();

  async onModuleInit() {
    if (this.useDapr) {
      try {
        this.daprClient = new DaprClient({
          daprHost: process.env.DAPR_HOST || '127.0.0.1',
          daprPort: process.env.DAPR_HTTP_PORT || '3500',
        });
        this.logger.log('Dapr Config Service initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Dapr client', error);
      }
    } else {
      this.logger.warn('Dapr is disabled. Using default configuration.');
    }
  }

  /**
   * Get configuration value
   */
  async getConfig(key: string, defaultValue?: any): Promise<any> {
    // Check cache first
    if (this.configCache.has(key)) {
      return this.configCache.get(key);
    }

    if (this.useDapr && this.daprClient) {
      try {
        // In a real implementation, you would use Dapr Configuration API
        // For now, we'll use a simple approach
        const config = await this.getConfigFromEnv(key, defaultValue);
        this.configCache.set(key, config);
        return config;
      } catch (error) {
        this.logger.error(`Failed to get config '${key}' from Dapr: ${error.message}`);
        return defaultValue;
      }
    }

    return this.getConfigFromEnv(key, defaultValue);
  }

  /**
   * Get security configuration
   */
  async getSecurityConfig() {
    return {
      rateLimitEnabled: await this.getConfig('security.rateLimit.enabled', true),
      rateLimitMax: await this.getConfig('security.rateLimit.max', 100),
      rateLimitWindowMs: await this.getConfig('security.rateLimit.windowMs', 60000),
      corsEnabled: await this.getConfig('security.cors.enabled', true),
      corsOrigin: await this.getConfig('security.cors.origin', process.env.FRONTEND_URL),
      jwtExpiresIn: await this.getConfig('security.jwt.expiresIn', '7d'),
      maxFileSize: await this.getConfig('security.upload.maxFileSize', 5242880),
      allowedFileTypes: await this.getConfig('security.upload.allowedTypes', [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ]),
    };
  }

  /**
   * Get feature flags
   */
  async getFeatureFlags() {
    return {
      swaggerEnabled: await this.getConfig('features.swagger.enabled', process.env.NODE_ENV !== 'production'),
      loggingEnabled: await this.getConfig('features.logging.enabled', true),
      metricsEnabled: await this.getConfig('features.metrics.enabled', true),
      cachingEnabled: await this.getConfig('features.caching.enabled', false),
    };
  }

  /**
   * Clear configuration cache
   */
  clearCache() {
    this.configCache.clear();
    this.logger.log('Configuration cache cleared');
  }

  /**
   * Fallback to environment variables
   */
  private getConfigFromEnv(key: string, defaultValue?: any): any {
    const envKey = key.toUpperCase().replace(/\./g, '_');
    const value = process.env[envKey];
    return value !== undefined ? value : defaultValue;
  }
}
