import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DaprClient } from '@dapr/dapr';

@Injectable()
export class DaprSecretsService implements OnModuleInit {
  private readonly logger = new Logger(DaprSecretsService.name);
  private daprClient: DaprClient;
  private readonly secretStoreName = process.env.DAPR_SECRET_STORE || 'local-secret-store';
  private readonly useDapr = process.env.USE_DAPR === 'true';
  private secretsCache: Map<string, { value: string; timestamp: number }> = new Map();
  private readonly cacheTTL = 300000; // 5 minutes

  async onModuleInit() {
    if (this.useDapr) {
      try {
        this.daprClient = new DaprClient({
          daprHost: process.env.DAPR_HOST || '127.0.0.1',
          daprPort: process.env.DAPR_HTTP_PORT || '3500',
        });
        this.logger.log('Dapr Secrets Service initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Dapr client', error);
      }
    } else {
      this.logger.warn('Dapr is disabled. Using environment variables for secrets.');
    }
  }

  /**
   * Get a secret from Dapr secret store with caching
   */
  async getSecret(key: string): Promise<string> {
    // Check cache first
    const cached = this.secretsCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.value;
    }

    if (this.useDapr && this.daprClient) {
      try {
        const secret = await this.daprClient.secret.get(this.secretStoreName, key);
        const value = secret[key];
        
        // Cache the secret
        this.secretsCache.set(key, { value, timestamp: Date.now() });
        
        this.logger.log(`Secret '${key}' retrieved from Dapr`);
        return value;
      } catch (error) {
        this.logger.error(`Failed to get secret '${key}' from Dapr: ${error.message}`);
        // Fallback to environment variable
        return this.getSecretFromEnv(key);
      }
    }

    return this.getSecretFromEnv(key);
  }

  /**
   * Get multiple secrets at once
   */
  async getSecrets(keys: string[]): Promise<Record<string, string>> {
    const secrets: Record<string, string> = {};
    
    for (const key of keys) {
      secrets[key] = await this.getSecret(key);
    }
    
    return secrets;
  }

  /**
   * Get all secrets from the secret store
   */
  async getAllSecrets(): Promise<Record<string, string>> {
    if (this.useDapr && this.daprClient) {
      try {
        const secrets = await this.daprClient.secret.getBulk(this.secretStoreName);
        this.logger.log('All secrets retrieved from Dapr');
        return secrets as Record<string, string>;
      } catch (error) {
        this.logger.error(`Failed to get all secrets from Dapr: ${error.message}`);
        return {};
      }
    }

    return {};
  }

  /**
   * Clear secrets cache
   */
  clearCache() {
    this.secretsCache.clear();
    this.logger.log('Secrets cache cleared');
  }

  /**
   * Fallback to environment variables
   */
  private getSecretFromEnv(key: string): string {
    const envKey = key.toUpperCase().replace(/-/g, '_');
    const value = process.env[envKey];
    
    if (!value) {
      this.logger.warn(`Secret '${key}' not found in environment variables`);
    }
    
    return value || '';
  }

  /**
   * Get database connection secrets
   */
  async getDatabaseSecrets() {
    return {
      host: await this.getSecret('db-host'),
      port: await this.getSecret('db-port'),
      username: await this.getSecret('db-username'),
      password: await this.getSecret('db-password'),
      database: await this.getSecret('db-name'),
    };
  }

  /**
   * Get JWT secrets
   */
  async getJWTSecrets() {
    return {
      secret: await this.getSecret('jwt-secret'),
      expiresIn: await this.getSecret('jwt-expires-in'),
    };
  }
}
