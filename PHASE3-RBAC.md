# Phase 3: Role-Based Access Control (RBAC) - Complete ✅

## What's Been Implemented

### 1. Roles System

**User Roles Enum:**
```typescript
enum UserRole {
  OWNER = 'owner',      // Full access to everything
  MANAGER = 'manager',  // Management operations
  KITCHEN = 'kitchen',  // Kitchen operations (order status updates)
  WAITER = 'waiter',    // Order taking and viewing
}
```

### 2. RBAC Components

**RolesGuard** (`src/auth/guards/roles.guard.ts`)
- Checks if user has required role(s) for a route
- Works with @Roles() decorator
- Provides clear error messages when access is denied

**@Roles() Decorator** (`src/auth/decorators/roles.decorator.ts`)
- Applied to controller methods
- Accepts multiple roles (OR logic)
- Example: `@Roles(UserRole.OWNER, UserRole.MANAGER)`

### 3. Protected Routes

#### Tenants Module
| Endpoint | Allowed Roles |
|----------|---------------|
| POST /tenants | OWNER |
| GET /tenants | OWNER, MANAGER |
| GET /tenants/:id | OWNER, MANAGER |
| PATCH /tenants/:id | OWNER |
| DELETE /tenants/:id | OWNER |

#### Profiles Module
| Endpoint | Allowed Roles |
|----------|---------------|
| POST /profiles | OWNER, MANAGER |
| GET /profiles | ALL (authenticated) |
| GET /profiles/:id | ALL (authenticated) |
| PATCH /profiles/:id | OWNER, MANAGER |
| DELETE /profiles/:id | OWNER, MANAGER |

#### Menu Items Module
| Endpoint | Allowed Roles |
|----------|---------------|
| POST /menu-items | OWNER, MANAGER |
| GET /menu-items | ALL (authenticated) |
| GET /menu-items/:id | ALL (authenticated) |
| PATCH /menu-items/:id | OWNER, MANAGER |
| DELETE /menu-items/:id | OWNER, MANAGER |

#### Orders Module
| Endpoint | Allowed Roles |
|----------|---------------|
| POST /orders | OWNER, MANAGER, WAITER |
| GET /orders | ALL (authenticated) |
| GET /orders/:id | ALL (authenticated) |
| PATCH /orders/:id | OWNER, MANAGER |
| PATCH /orders/:id/status | OWNER, MANAGER, KITCHEN |
| DELETE /orders/:id | OWNER, MANAGER |

### 4. Order Status Management

**New Endpoint:** `PATCH /orders/:id/status`

**Features:**
- Dedicated endpoint for status updates
- Validates status transitions
- Logs all status changes
- Prevents invalid transitions

**Valid Status Transitions:**
```
pending → preparing, cancelled
preparing → ready, cancelled
ready → delivered, cancelled
delivered → (no transitions)
cancelled → (no transitions)
```

**Status Transition Rules:**
- Cannot go backwards (e.g., delivered → preparing)
- Can cancel from pending, preparing, or ready
- Cannot change status once delivered or cancelled

**Example Request:**
```json
PATCH /api/orders/uuid/status
{
  "status": "preparing"
}
```

**Status Change Logging:**
Every status change is logged with:
- Order ID
- Old status → New status
- User email and role who made the change

### 5. Error Responses

**403 Forbidden - Insufficient Role:**
```json
{
  "statusCode": 403,
  "message": "Access denied. Required roles: owner, manager. Your role: waiter",
  "error": "Forbidden"
}
```

**400 Bad Request - Invalid Status Transition:**
```json
{
  "statusCode": 400,
  "message": "Invalid status transition from delivered to preparing",
  "error": "Bad Request"
}
```

---

## Usage Examples

### 1. Owner Creates Menu Item
```http
POST /api/menu-items
Authorization: Bearer <owner-token>
Content-Type: application/json

{
  "name": "Pizza",
  "price": 12.99
}
```
✅ Success - Owner has permission

### 2. Waiter Tries to Create Menu Item
```http
POST /api/menu-items
Authorization: Bearer <waiter-token>
Content-Type: application/json

{
  "name": "Pizza",
  "price": 12.99
}
```
❌ 403 Forbidden - Waiter doesn't have permission

### 3. Kitchen Updates Order Status
```http
PATCH /api/orders/uuid/status
Authorization: Bearer <kitchen-token>
Content-Type: application/json

{
  "status": "ready"
}
```
✅ Success - Kitchen can update order status

### 4. Waiter Tries to Update Order Status
```http
PATCH /api/orders/uuid/status
Authorization: Bearer <waiter-token>
Content-Type: application/json

{
  "status": "ready"
}
```
❌ 403 Forbidden - Waiter cannot update order status

### 5. Invalid Status Transition
```http
PATCH /api/orders/uuid/status
Authorization: Bearer <kitchen-token>
Content-Type: application/json

{
  "status": "preparing"
}
```
❌ 400 Bad Request - Cannot go from "delivered" to "preparing"

---

## Implementation Details

### How to Apply RBAC to a Route

```typescript
@Controller('resource')
@UseGuards(JwtAuthGuard, RolesGuard)  // Apply both guards
export class ResourceController {
  
  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)  // Only these roles
  create(@Body() dto: CreateDto) {
    // ...
  }

  @Get()
  // No @Roles() decorator = all authenticated users
  findAll() {
    // ...
  }
}
```

### Guard Execution Order
1. JwtAuthGuard - Validates JWT token
2. RolesGuard - Checks user role against required roles

### Role Check Logic
- If no @Roles() decorator → Allow all authenticated users
- If @Roles(A, B) decorator → Allow if user has role A OR role B
- If user doesn't have required role → 403 Forbidden

---

## Testing RBAC

Use `test-phase3-rbac.http` to test role-based access control with different user roles.

**Test Scenarios:**
1. Owner can do everything
2. Manager can manage but not delete tenants
3. Kitchen can only update order status
4. Waiter can create orders but not manage menu items

---

## Security Best Practices Implemented

✅ Principle of least privilege (each role has minimum necessary permissions)
✅ Clear separation of concerns (kitchen vs waiter vs manager)
✅ Audit logging for sensitive operations (order status changes)
✅ Validation of state transitions (order status)
✅ Descriptive error messages for debugging
✅ Guard composition (JWT + Roles)

---

## Next Steps

Ready for Phase 4? Confirm to proceed with:
- File Upload Module
- Storage Service
- Menu item image upload
- Tenant logo upload
- File validation (size, type)
- Multer integration
