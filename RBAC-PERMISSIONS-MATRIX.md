# RBAC Permissions Matrix

## Quick Reference Guide

| Resource | Operation | Owner | Manager | Kitchen | Waiter |
|----------|-----------|-------|---------|---------|--------|
| **Tenants** |
| Create | ✅ | ❌ | ❌ | ❌ |
| List | ✅ | ✅ | ❌ | ❌ |
| View | ✅ | ✅ | ❌ | ❌ |
| Update | ✅ | ❌ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| **Profiles** |
| Create | ✅ | ✅ | ❌ | ❌ |
| List | ✅ | ✅ | ✅ | ✅ |
| View | ✅ | ✅ | ✅ | ✅ |
| Update | ✅ | ✅ | ❌ | ❌ |
| Delete | ✅ | ✅ | ❌ | ❌ |
| **Menu Items** |
| Create | ✅ | ✅ | ❌ | ❌ |
| List | ✅ | ✅ | ✅ | ✅ |
| View | ✅ | ✅ | ✅ | ✅ |
| Update | ✅ | ✅ | ❌ | ❌ |
| Delete | ✅ | ✅ | ❌ | ❌ |
| **Orders** |
| Create | ✅ | ✅ | ❌ | ✅ |
| List | ✅ | ✅ | ✅ | ✅ |
| View | ✅ | ✅ | ✅ | ✅ |
| Update | ✅ | ✅ | ❌ | ❌ |
| Update Status | ✅ | ✅ | ✅ | ❌ |
| Delete | ✅ | ✅ | ❌ | ❌ |

---

## Role Descriptions

### 👑 Owner
**Full administrative access**
- Manage tenants (create, update, delete)
- Manage all resources
- View all data
- Update order status
- Highest level of access

**Typical Use Cases:**
- Restaurant owner
- System administrator
- Business owner

### 👔 Manager
**Management operations**
- Manage menu items
- Manage profiles
- Manage orders
- Update order status
- View tenants (but cannot modify)

**Typical Use Cases:**
- Restaurant manager
- Shift supervisor
- Operations manager

### 👨‍🍳 Kitchen
**Kitchen operations only**
- View orders
- Update order status (preparing, ready, etc.)
- View menu items
- Cannot create or delete anything

**Typical Use Cases:**
- Chef
- Kitchen staff
- Food preparation team

### 🍽️ Waiter
**Order taking and viewing**
- Create orders
- View orders
- View menu items
- View profiles
- Cannot update order status
- Cannot manage menu items

**Typical Use Cases:**
- Waiter/Waitress
- Server
- Front-of-house staff

---

## Order Status Workflow

```
┌─────────┐
│ PENDING │ ← Waiter creates order
└────┬────┘
     │
     ├─→ Kitchen/Manager updates to PREPARING
     │
┌──────────┐
│PREPARING │
└────┬─────┘
     │
     ├─→ Kitchen/Manager updates to READY
     │
┌──────┐
│ READY│
└───┬──┘
    │
    ├─→ Kitchen/Manager updates to DELIVERED
    │
┌───────────┐
│ DELIVERED │ (Final state)
└───────────┘

At any point before DELIVERED:
├─→ Can be CANCELLED by Owner/Manager
```

---

## Common Scenarios

### Scenario 1: New Order Flow
1. **Waiter** creates order → Status: PENDING
2. **Kitchen** sees order and starts preparing → Status: PREPARING
3. **Kitchen** finishes cooking → Status: READY
4. **Kitchen** or **Manager** marks as delivered → Status: DELIVERED

### Scenario 2: Menu Management
1. **Owner** or **Manager** creates new menu item
2. **Kitchen** views available menu items
3. **Waiter** views menu to take orders
4. **Owner** or **Manager** updates prices/availability

### Scenario 3: Staff Management
1. **Owner** creates tenant
2. **Owner** or **Manager** creates user profiles
3. **Owner** or **Manager** updates staff information
4. All staff can view their own profile

### Scenario 4: Order Cancellation
1. Customer changes mind
2. **Owner** or **Manager** cancels order
3. Order status → CANCELLED (cannot be changed after)

---

## Error Scenarios

### ❌ Waiter tries to update menu item
```
403 Forbidden
"Access denied. Required roles: owner, manager. Your role: waiter"
```

### ❌ Kitchen tries to delete order
```
403 Forbidden
"Access denied. Required roles: owner, manager. Your role: kitchen"
```

### ❌ Invalid status transition
```
400 Bad Request
"Invalid status transition from delivered to preparing"
```

### ❌ Waiter tries to update order status
```
403 Forbidden
"Access denied. Required roles: owner, manager, kitchen. Your role: waiter"
```

---

## Implementation Notes

### Adding RBAC to New Endpoints

```typescript
@Controller('resource')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResourceController {
  
  // Only Owner and Manager
  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  create() { }

  // All authenticated users
  @Get()
  findAll() { }

  // Only Owner
  @Delete(':id')
  @Roles(UserRole.OWNER)
  remove() { }
}
```

### Testing Different Roles

1. Create users with different roles during signup
2. Login with each user to get role-specific tokens
3. Test endpoints with different tokens
4. Verify 403 errors for unauthorized access

---

## Security Considerations

✅ **Implemented:**
- Role-based access control on all sensitive operations
- Tenant isolation (users only see their tenant's data)
- Status transition validation
- Audit logging for status changes
- Clear error messages for debugging

⚠️ **Best Practices:**
- Always use both JwtAuthGuard and RolesGuard together
- Apply @Roles() decorator to sensitive operations
- Log important state changes
- Validate business logic (like status transitions)
- Test with all role types

---

## Future Enhancements

Potential additions for more advanced RBAC:
- Permission-based access (more granular than roles)
- Dynamic role assignment
- Role hierarchy (inheritance)
- Resource-level permissions
- Time-based access control
- IP-based restrictions
