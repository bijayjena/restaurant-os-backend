# Dapr Security Integration

## Overview

This document describes the Dapr (Distributed Application Runtime) security integration implemented in the Restaurant OS Backend to enhance security, secrets management, and configuration management.

## 🔐 Security Features Implemented

### 1. Dapr Secrets Management

**Service:** `DaprSecretsService`

**Features:**
- Centralized secrets management
- Support for multiple secret stores (Kubernetes, HashiCorp Vault, Azure Key Vault, AWS Secrets Manager)
- Secrets caching with TTL (5 minutes)
- Automatic fallback to environment variables
- Bulk secret retrieval

**Usage:**
```typescript
// Get a single secret
const jwtSecret = await daprSecretsService.getSecret('jwt-secret');

// Get multiple secrets
const dbSecrets = await daprSecretsService.getDatabaseSecrets();

// Get JWT secrets
const jwtConfig = await daprSecretsService.getJWTSecrets();
```

**Benefits:**
- Secrets never stored in code or version control
- Centralized secret rotation
- Cloud-agnostic secret management
- Automatic secret refresh

---

### 2. Dapr Security Service

**Service:** `DaprSecurityService`

**Features:**
- Data encryption/decryption (AES-256-GCM)
- Secure token generation
- HMAC signature generation and verification
- Input sanitization
- IP address validation
- Rate limiting (in-memory)
- API key generation
- Sensitive data masking

**Usage:**
```typescript
// Encrypt sensitive data
const encrypted = await daprSecurityService.encryptData('sensitive-data');

// Generate secure token
const token = daprSecurityService.generateSecureToken(32);

// Generate HMAC signature
const signature = daprSecurityService.generateHMAC(data, secret);

// Verify HMAC
const isValid = daprSecurityService.verifyHMAC(data, signature, secret);

// Sanitize input
const clean = daprSecurityService.sanitizeInput(userInput);

// Generate API key
const apiKey = daprSecurityService.generateAPIKey();

// Mask sensitive data for logging
const masked = daprSecurityService.maskSensitiveData('password123', 2);
// Output: "pa*********"
```

---

### 3. Dapr Configuration Service

**Service:** `DaprConfigService`

**Features:**
- Centralized configuration management
- Configuration caching
- Feature flags support
- Security configuration
- Environment-based configuration

**Usage:**
```typescript
// Get security configuration
const securityConfig = await daprConfigService.getSecurityConfig();

// Get feature flags
const features = await daprConfigService.getFeatureFlags();

// Get specific config
const maxFileSize = await daprConfigService.getConfig('security.upload.maxFileSize', 5242880);
```

---

### 4. Security Guards

#### DaprSecurityGuard

**Features:**
- Request signature verification
- Timestamp validation (prevents replay attacks)
- Rate limiting per client
- API key validation

**Usage:**
```typescript
@Controller('secure-endpoint')
@UseGuards(DaprSecurityGuard)
export class SecureController {
  @Get()
  secureEndpoint() {
    return { message: 'This endpoint is protected' };
  }
}
```

**Request Signature:**
```typescript
// Client-side signature generation
const timestamp = Date.now().toString();
const data = `${method}:${url}:${timestamp}`;
const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');

// Add headers
headers['X-Timestamp'] = timestamp;
headers['X-Signature'] = signature;
```

---

### 5. Security Middleware

#### SecurityHeadersMiddleware

**Features:**
- Adds security headers to all responses
- Prevents clickjacking (X-Frame-Options)
- Prevents MIME sniffing (X-Content-Type-Options)
- XSS protection
- HSTS (HTTP Strict Transport Security)
- Content Security Policy
- Removes sensitive headers (X-Powered-By)

**Headers Added:**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

### 6. Audit Logging Interceptor

**Interceptor:** `AuditLogInterceptor`

**Features:**
- Logs all sensitive operations (POST, PUT, PATCH, DELETE)
- Tracks user actions
- Records IP addresses and user agents
- Logs success and failure
- Performance tracking

**Log Format:**
```
[AUDIT] POST /api/orders - User: user@example.com - IP: 127.0.0.1 - UserAgent: Mozilla/5.0...
[AUDIT SUCCESS] POST /api/orders - User: user@example.com - 45ms
[AUDIT FAILURE] DELETE /api/tenants/123 - User: user@example.com - Error: Forbidden - 12ms
```

---

## 🚀 Setup and Configuration

### 1. Environment Variables

Add to `.env`:
```env
# Dapr Configuration
USE_DAPR=false
DAPR_HOST=127.0.0.1
DAPR_HTTP_PORT=3500
DAPR_GRPC_PORT=50001
DAPR_SECRET_STORE=local-secret-store
DAPR_CONFIG_STORE=local-config-store

# Security
REQUEST_SIGNATURE_SECRET=your-signature-secret-key
API_KEY_SECRET=your-api-key-secret
```

### 2. Dapr Installation

**Install Dapr CLI:**
```bash
# Windows (PowerShell)
powershell -Command "iwr -useb https://raw.githubusercontent.com/dapr/cli/master/install/install.ps1 | iex"

# macOS/Linux
wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash

# Verify installation
dapr --version
```

**Initialize Dapr:**
```bash
dapr init
```

### 3. Dapr Components Configuration

**Create `components/secrets.yaml`:**
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: local-secret-store
spec:
  type: secretstores.local.file
  version: v1
  metadata:
  - name: secretsFile
    value: ./secrets.json
  - name: nestedSeparator
    value: ":"
```

**Create `secrets.json`:**
```json
{
  "jwt-secret": "your-super-secret-jwt-key",
  "jwt-expires-in": "7d",
  "db-host": "localhost",
  "db-port": "5432",
  "db-username": "postgres",
  "db-password": "postgres",
  "db-name": "restaurant_os"
}
```

**Create `components/config.yaml`:**
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: local-config-store
spec:
  type: configuration.redis
  version: v1
  metadata:
  - name: redisHost
    value: localhost:6379
  - name: redisPassword
    value: ""
```

### 4. Running with Dapr

**Start the application with Dapr:**
```bash
# Set USE_DAPR=true in .env
USE_DAPR=true

# Run with Dapr sidecar
dapr run --app-id restaurant-os-backend --app-port 3000 --dapr-http-port 3500 --components-path ./components npm run start:dev
```

**Without Dapr (fallback mode):**
```bash
# Set USE_DAPR=false in .env
USE_DAPR=false

# Run normally
npm run start:dev
```

---

## 🔒 Security Best Practices

### 1. Secrets Management

✅ **Do:**
- Store all secrets in Dapr secret store
- Use different secrets for different environments
- Rotate secrets regularly
- Use strong, random secrets
- Enable secret caching for performance

❌ **Don't:**
- Commit secrets to version control
- Hardcode secrets in code
- Share secrets via email/chat
- Use weak or predictable secrets

### 2. Request Signing

**Client Implementation:**
```typescript
import * as crypto from 'crypto';

function signRequest(method: string, url: string, secret: string) {
  const timestamp = Date.now().toString();
  const data = `${method}:${url}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
  
  return {
    'X-Timestamp': timestamp,
    'X-Signature': signature,
  };
}

// Usage
const headers = signRequest('POST', '/api/orders', 'your-secret');
```

### 3. API Key Authentication

**Generate API Key:**
```typescript
const apiKey = daprSecurityService.generateAPIKey();
// Output: rsk_AbCdEfGhIjKlMnOpQrStUvWxYz123456
```

**Use API Key:**
```bash
curl -X GET http://localhost:3000/api/secure-endpoint \
  -H "X-API-Key: rsk_AbCdEfGhIjKlMnOpQrStUvWxYz123456"
```

### 4. Rate Limiting

**Per-IP Rate Limiting:**
- 100 requests per minute per IP
- Automatic blocking when limit exceeded
- Configurable limits

**Per-API-Key Rate Limiting:**
- Separate limits for API key users
- Higher limits for authenticated users

---

## 📊 Monitoring and Observability

### Audit Logs

All sensitive operations are logged:
```
[AUDIT] POST /api/orders - User: john@example.com - IP: 192.168.1.100
[AUDIT SUCCESS] POST /api/orders - User: john@example.com - 45ms
```

### Security Events

Security-related events are logged:
```
[DaprSecurityService] Secret 'jwt-secret' retrieved from Dapr
[DaprSecurityGuard] Rate limit exceeded for ip:192.168.1.100
[DaprSecurityGuard] Invalid request signature from ip:192.168.1.100
```

---

## 🧪 Testing

### Test Request Signing

```bash
# Generate signature
timestamp=$(date +%s000)
data="GET:/api/secure-endpoint:$timestamp"
signature=$(echo -n "$data" | openssl dgst -sha256 -hmac "your-secret" | cut -d' ' -f2)

# Make request
curl -X GET http://localhost:3000/api/secure-endpoint \
  -H "X-Timestamp: $timestamp" \
  -H "X-Signature: $signature"
```

### Test API Key

```bash
curl -X GET http://localhost:3000/api/secure-endpoint \
  -H "X-API-Key: rsk_your_api_key_here"
```

### Test Rate Limiting

```bash
# Send 101 requests rapidly
for i in {1..101}; do
  curl -X GET http://localhost:3000/api/orders
done
# 101st request should return 429 Too Many Requests
```

---

## 🔄 Migration Guide

### From Environment Variables to Dapr Secrets

**Before:**
```typescript
const jwtSecret = process.env.JWT_SECRET;
```

**After:**
```typescript
const jwtSecret = await daprSecretsService.getSecret('jwt-secret');
```

### Enabling Dapr in Production

1. Set `USE_DAPR=true` in production environment
2. Configure production secret store (Azure Key Vault, AWS Secrets Manager, etc.)
3. Update Dapr components configuration
4. Deploy with Dapr sidecar
5. Monitor logs for Dapr initialization

---

## 📚 Additional Resources

- [Dapr Documentation](https://docs.dapr.io/)
- [Dapr Secrets Management](https://docs.dapr.io/developing-applications/building-blocks/secrets/)
- [Dapr Security](https://docs.dapr.io/concepts/security-concept/)
- [Dapr Best Practices](https://docs.dapr.io/operations/best-practices/)

---

## 🎯 Benefits Summary

✅ **Security:**
- Centralized secrets management
- Request signing and verification
- Rate limiting
- Security headers
- Audit logging

✅ **Scalability:**
- Cloud-agnostic architecture
- Microservices-ready
- Service-to-service authentication
- Configuration management

✅ **Maintainability:**
- Separation of concerns
- Easy secret rotation
- Feature flags
- Environment-based configuration

✅ **Compliance:**
- Audit trails
- Access control
- Data encryption
- Security best practices
