# Restaurant OS Backend - Setup Guide

## Phase 1: Authentication Complete ✅

### What's Been Implemented

1. **Authentication Module**
   - JWT-based authentication
   - Signup endpoint with profile creation
   - Login endpoint with validation
   - `/auth/me` endpoint for current user
   - Password hashing with bcrypt
   - Token expiration (7 days default)

2. **Security Features**
   - JwtAuthGuard for protected routes
   - @CurrentUser() decorator for easy user access
   - Password excluded from responses using class-transformer
   - Validation using class-validator
   - CORS enabled

3. **Database Entities**
   - User (with role enum)
   - Tenant
   - Profile
   - MenuItem
   - Order

4. **Configuration**
   - Environment variables setup
   - TypeORM configured with PostgreSQL
   - Global validation pipe
   - Global serialization interceptor

### Setup Instructions

1. **Install PostgreSQL** (if not already installed)

2. **Create Database**
   ```bash
   psql -U postgres
   CREATE DATABASE restaurant_os;
   \q
   ```

3. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Update database credentials if needed
   - Change JWT_SECRET to a secure random string

4. **Run the Application**
   ```bash
   npm run start:dev
   ```

5. **Test the Endpoints**

   The API is available at: `http://localhost:3000/api`

   **Create a Tenant First** (using a database client or SQL):
   ```sql
   INSERT INTO tenants (id, name, is_active, created_at, updated_at)
   VALUES (gen_random_uuid(), 'Test Restaurant', true, NOW(), NOW());
   ```

   **Signup**:
   ```bash
   POST http://localhost:3000/api/auth/signup
   Content-Type: application/json

   {
     "email": "owner@restaurant.com",
     "password": "password123",
     "role": "owner",
     "tenant_id": "<tenant-id-from-above>",
     "first_name": "John",
     "last_name": "Doe",
     "phone": "+1234567890"
   }
   ```

   **Login**:
   ```bash
   POST http://localhost:3000/api/auth/login
   Content-Type: application/json

   {
     "email": "owner@restaurant.com",
     "password": "password123"
   }
   ```

   **Get Current User**:
   ```bash
   GET http://localhost:3000/api/auth/me
   Authorization: Bearer <your-token>
   ```

### API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/signup` | No | Register new user |
| POST | `/api/auth/login` | No | Login user |
| GET | `/api/auth/me` | Yes | Get current user |

### User Roles

- `owner` - Full access
- `manager` - Management access
- `kitchen` - Kitchen operations
- `waiter` - Order taking

### Next Steps

Ready for Phase 2? Confirm to proceed with:
- Tenants CRUD module
- Profiles CRUD module
- UserRoles CRUD module
- MenuItems CRUD module
- Orders CRUD module

All with pagination, filtering, and proper validation.
