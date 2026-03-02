# Restaurant OS Backend - API Reference

Base URL: `http://localhost:3000/api`

## Authentication

All endpoints except `/auth/signup` and `/auth/login` require JWT authentication.

**Header Format:**
```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints Summary

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | No | Register new user |
| POST | `/auth/login` | No | Login user |
| GET | `/auth/me` | Yes | Get current user |

### Tenants
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/tenants` | Yes | Create tenant |
| GET | `/tenants` | Yes | List tenants |
| GET | `/tenants/:id` | Yes | Get tenant |
| PATCH | `/tenants/:id` | Yes | Update tenant |
| DELETE | `/tenants/:id` | Yes | Delete tenant |

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `is_active` (boolean)

### Profiles
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/profiles` | Yes | Create profile |
| GET | `/profiles` | Yes | List profiles |
| GET | `/profiles/:id` | Yes | Get profile |
| PATCH | `/profiles/:id` | Yes | Update profile |
| DELETE | `/profiles/:id` | Yes | Delete profile |

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `user_id` (uuid)

### Menu Items
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/menu-items` | Yes | Create menu item |
| GET | `/menu-items` | Yes | List menu items |
| GET | `/menu-items/:id` | Yes | Get menu item |
| PATCH | `/menu-items/:id` | Yes | Update menu item |
| DELETE | `/menu-items/:id` | Yes | Delete menu item |

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `tenant_id` (uuid)
- `is_available` (boolean)
- `category` (string)

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/orders` | Yes | Create order |
| GET | `/orders` | Yes | List orders |
| GET | `/orders/:id` | Yes | Get order |
| PATCH | `/orders/:id` | Yes | Update order |
| DELETE | `/orders/:id` | Yes | Delete order |

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `tenant_id` (uuid)
- `status` (enum: pending, preparing, ready, delivered, cancelled)

---

## Data Models

### User Roles
- `owner` - Full access
- `manager` - Management access
- `kitchen` - Kitchen operations
- `waiter` - Order taking

### Order Status
- `pending` - Order placed
- `preparing` - Being prepared
- `ready` - Ready for delivery
- `delivered` - Delivered to customer
- `cancelled` - Cancelled

---

## Example Requests

### Create Order
```json
POST /api/orders
{
  "table_number": "A5",
  "items": [
    {
      "menu_item_id": "uuid-here",
      "quantity": 2
    }
  ],
  "notes": "Extra cheese"
}
```

### Create Menu Item
```json
POST /api/menu-items
{
  "name": "Margherita Pizza",
  "description": "Classic pizza",
  "price": 12.99,
  "category": "Pizza",
  "is_available": true
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["field must be a string"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Cannot access resource from different tenant",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource with ID xyz not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Resource already exists",
  "error": "Conflict"
}
```
