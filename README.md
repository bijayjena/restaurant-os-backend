# Restaurant OS Backend

A production-ready NestJS backend for Restaurant Operating System with complete authentication, RBAC, file uploads, and comprehensive API documentation.

## 🚀 Features

### Core Features
- ✅ JWT Authentication with role-based access control
- ✅ Multi-tenant architecture
- ✅ Complete CRUD operations for all resources
- ✅ File upload system (menu images, tenant logos)
- ✅ Order management with status tracking
- ✅ Pagination and filtering on all list endpoints
- ✅ Comprehensive validation and error handling

### Security
- ✅ Role-based access control (Owner, Manager, Kitchen, Waiter)
- ✅ Tenant isolation
- ✅ Rate limiting (100 req/min)
- ✅ File upload validation
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ CORS configuration
- ✅ **Dapr security integration**
- ✅ **Secrets management with Dapr**
- ✅ **Request signing and verification**
- ✅ **Security headers middleware**
- ✅ **Audit logging for sensitive operations**

### Production Ready
- ✅ Global exception handling
- ✅ Request/response logging
- ✅ API documentation (Swagger)
- ✅ Rate limiting
- ✅ Environment configuration
- ✅ Performance monitoring
- ✅ **Dapr distributed runtime integration**

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd restaurant-os-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Create database**
```bash
psql -U postgres
CREATE DATABASE restaurant_os;
\q
```

5. **Run the application**
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 📚 API Documentation

Once the application is running, visit:
```
http://localhost:3000/api/docs
```

Interactive Swagger documentation with:
- All endpoints documented
- Request/response examples
- Try-it-out functionality
- JWT authentication support

## 🏗️ Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── guards/          # JWT and Roles guards
│   ├── decorators/      # Custom decorators
│   └── strategies/      # Passport strategies
├── common/              # Shared utilities
│   ├── filters/         # Exception filters
│   ├── interceptors/    # Logging interceptors
│   └── dto/            # Common DTOs
├── entities/            # TypeORM entities
├── tenants/            # Tenant management
├── profiles/           # User profiles
├── menu-items/         # Menu item management
├── orders/             # Order management
├── storage/            # File upload service
└── main.ts             # Application entry point
```

## 🔐 User Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full access to everything |
| **Manager** | Manage menu items, orders, profiles (cannot delete tenants) |
| **Kitchen** | View orders, update order status |
| **Waiter** | Create orders, view menu items and orders |

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Tenants
- `POST /api/tenants` - Create tenant (Owner only)
- `GET /api/tenants` - List tenants
- `GET /api/tenants/:id` - Get tenant
- `PATCH /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant (Owner only)

### Profiles
- `POST /api/profiles` - Create profile
- `GET /api/profiles` - List profiles
- `GET /api/profiles/:id` - Get profile
- `PATCH /api/profiles/:id` - Update profile
- `DELETE /api/profiles/:id` - Delete profile

### Menu Items
- `POST /api/menu-items` - Create menu item (Owner/Manager)
- `GET /api/menu-items` - List menu items
- `GET /api/menu-items/:id` - Get menu item
- `PATCH /api/menu-items/:id` - Update menu item (Owner/Manager)
- `DELETE /api/menu-items/:id` - Delete menu item (Owner/Manager)

### Orders
- `POST /api/orders` - Create order (Owner/Manager/Waiter)
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order
- `PATCH /api/orders/:id` - Update order (Owner/Manager)
- `PATCH /api/orders/:id/status` - Update order status (Owner/Manager/Kitchen)
- `DELETE /api/orders/:id` - Delete order (Owner/Manager)

### Storage
- `POST /api/storage/menu-items/:id/image` - Upload menu item image
- `POST /api/storage/tenants/:id/logo` - Upload tenant logo
- `DELETE /api/storage/menu-items/:id/image` - Delete menu item image
- `DELETE /api/storage/tenants/:id/logo` - Delete tenant logo

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Environment Variables

```env
# Application
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=restaurant_os

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

## 🚢 Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

### Build and Deploy

```bash
# Build
npm run build

# Start production server
npm run start:prod
```

## 📖 Documentation

- [Setup Guide](SETUP.md)
- [Phase 1: Authentication](SETUP.md)
- [Phase 2: CRUD Modules](PHASE2-COMPLETE.md)
- [Phase 3: RBAC](PHASE3-RBAC.md)
- [Phase 4: File Upload](PHASE4-FILE-UPLOAD.md)
- [Phase 5: Production](PHASE5-PRODUCTION.md)
- [Dapr Security Integration](DAPR-SECURITY.md)
- [API Reference](API-REFERENCE.md)
- [RBAC Permissions Matrix](RBAC-PERMISSIONS-MATRIX.md)
- [File Upload Guide](FILE-UPLOAD-GUIDE.md)

## 🔧 Tech Stack

- **Framework:** NestJS 11
- **Language:** TypeScript 5
- **Database:** PostgreSQL with TypeORM
- **Authentication:** JWT with Passport
- **Validation:** class-validator
- **Documentation:** Swagger/OpenAPI
- **File Upload:** Multer
- **Rate Limiting:** @nestjs/throttler
- **Distributed Runtime:** Dapr (optional)
- **Security:** Dapr secrets management, request signing, HMAC verification

## 📄 License

This project is licensed under the UNLICENSED License.

---

**Built with ❤️ using NestJS**
