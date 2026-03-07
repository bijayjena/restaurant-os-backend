# Drizzle ORM Migration Guide

## 🎉 Migration from TypeORM to Drizzle ORM Complete!

**Migration Date:** In Progress

---

## 📊 What Changed

### Before (TypeORM)
- Decorator-based entity definitions
- Repository pattern with `@InjectRepository`
- Active Record / Data Mapper patterns
- Heavy runtime overhead
- Complex query builder

### After (Drizzle ORM)
- Schema-first approach with type safety
- Direct SQL-like queries
- Lightweight and fast
- Better TypeScript inference
- Simpler API

---

## 🔧 Key Changes

### 1. Schema Definition

**Before (TypeORM):**
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @ManyToOne(() => Tenant)
  tenant: Tenant;
}
```

**After (Drizzle):**
```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
});
```

### 2. Database Connection

**Before (TypeORM):**
```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  entities: [User, Tenant, ...],
  synchronize: true,
})
```

**After (Drizzle):**
```typescript
const pool = new Pool({ ... });
const db = drizzle(pool, { schema });
```

### 3. Queries

**Before (TypeORM):**
```typescript
const user = await this.userRepository.findOne({
  where: { email },
  relations: ['tenant'],
});
```

**After (Drizzle):**
```typescript
const [user] = await db
  .select()
  .from(schema.users)
  .where(eq(schema.users.email, email))
  .leftJoin(schema.tenants, eq(schema.users.tenantId, schema.tenants.id))
  .limit(1);
```

### 4. Inserts

**Before (TypeORM):**
```typescript
const user = this.userRepository.create({ email, password });
await this.userRepository.save(user);
```

**After (Drizzle):**
```typescript
const [user] = await db
  .insert(schema.users)
  .values({ email, password })
  .returning();
```

---

## 📁 New File Structure

```
src/
├── drizzle/
│   ├── schema.ts           # All table definitions
│   ├── drizzle.module.ts   # Drizzle module setup
│   └── migrations/         # Migration files
├── auth/
│   ├── auth.service.drizzle.ts  # Updated service
│   └── ...
└── ...

drizzle.config.ts           # Drizzle Kit configuration
drizzle/                    # Generated migrations
```

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install drizzle-orm postgres drizzle-kit
npm install dotenv
npm uninstall typeorm @nestjs/typeorm
```

### 2. Configure Drizzle

Create `drizzle.config.ts`:
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/drizzle/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
} satisfies Config;
```

### 3. Generate Migrations

```bash
# Generate migration from schema
npm run db:generate

# Push schema to database
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

---

## 📝 Schema Overview

### Tables Created

1. **tenants**
   - id (uuid, primary key)
   - name (varchar, unique)
   - logo (varchar, nullable)
   - isActive (boolean, default true)
   - createdAt, updatedAt (timestamps)

2. **users**
   - id (uuid, primary key)
   - email (varchar, unique)
   - password (varchar)
   - role (enum: owner, manager, kitchen, waiter)
   - tenantId (uuid, foreign key)
   - isActive (boolean, default true)
   - createdAt, updatedAt (timestamps)

3. **profiles**
   - id (uuid, primary key)
   - userId (uuid, foreign key)
   - firstName, lastName (varchar)
   - phone (varchar, nullable)
   - avatar (varchar, nullable)
   - createdAt, updatedAt (timestamps)

4. **menu_items**
   - id (uuid, primary key)
   - tenantId (uuid, foreign key)
   - name (varchar)
   - description (text, nullable)
   - price (decimal)
   - image (varchar, nullable)
   - isAvailable (boolean, default true)
   - category (varchar, nullable)
   - createdAt, updatedAt (timestamps)

5. **orders**
   - id (uuid, primary key)
   - tenantId (uuid, foreign key)
   - createdBy (uuid, foreign key)
   - tableNumber (varchar)
   - items (jsonb)
   - totalAmount (decimal)
   - status (enum: pending, preparing, ready, delivered, cancelled)
   - notes (text, nullable)
   - createdAt, updatedAt (timestamps)

---

## 🔄 Migration Status

### ✅ Completed
- [x] Drizzle schema definition
- [x] Drizzle module setup
- [x] Database connection configuration
- [x] Auth service migration
- [x] JWT strategy update
- [x] Guards and decorators update
- [x] Package.json scripts

### 🚧 In Progress
- [ ] Tenants service migration
- [ ] Profiles service migration
- [ ] Menu Items service migration
- [ ] Orders service migration
- [ ] Storage service migration

### 📋 TODO
- [ ] Update all controllers
- [ ] Update all modules
- [ ] Test all endpoints
- [ ] Update documentation
- [ ] Performance testing

---

## 💡 Query Examples

### Select with Join
```typescript
const users = await db
  .select({
    user: schema.users,
    tenant: schema.tenants,
  })
  .from(schema.users)
  .leftJoin(schema.tenants, eq(schema.users.tenantId, schema.tenants.id));
```

### Insert with Returning
```typescript
const [newUser] = await db
  .insert(schema.users)
  .values({
    email: 'user@example.com',
    password: hashedPassword,
    tenantId: 'uuid-here',
  })
  .returning();
```

### Update
```typescript
await db
  .update(schema.users)
  .set({ isActive: false })
  .where(eq(schema.users.id, userId));
```

### Delete
```typescript
await db
  .delete(schema.users)
  .where(eq(schema.users.id, userId));
```

### Complex Query with Multiple Conditions
```typescript
const orders = await db
  .select()
  .from(schema.orders)
  .where(
    and(
      eq(schema.orders.tenantId, tenantId),
      eq(schema.orders.status, 'pending')
    )
  )
  .limit(10)
  .offset(0);
```

---

## 🎯 Benefits of Drizzle ORM

### Performance
- **Faster queries:** Direct SQL generation
- **Smaller bundle:** ~10KB vs TypeORM's ~300KB
- **Less overhead:** No decorators, no reflection

### Developer Experience
- **Type safety:** Full TypeScript inference
- **SQL-like syntax:** Familiar to SQL developers
- **Better autocomplete:** IDE support is excellent
- **Simpler API:** Less magic, more explicit

### Features
- **Drizzle Studio:** Built-in database GUI
- **Migrations:** Automatic migration generation
- **Relations:** Type-safe relations
- **Transactions:** Full transaction support
- **Prepared statements:** Better performance

---

## 📚 Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [PostgreSQL Connector](https://orm.drizzle.team/docs/get-started-postgresql)
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)

---

## 🔧 Useful Commands

```bash
# Generate migration from schema changes
npm run db:generate

# Push schema directly to database (dev only)
npm run db:push

# Open Drizzle Studio
npm run db:studio

# Run migrations
npm run db:migrate
```

---

## ⚠️ Breaking Changes

1. **Entity imports:** Change from `entities/` to `drizzle/schema`
2. **Repository pattern:** Replace with direct db queries
3. **Decorators:** Remove all TypeORM decorators
4. **Relations:** Use Drizzle relations API
5. **Query builder:** Use Drizzle query API

---

## 🎉 Conclusion

Drizzle ORM provides a modern, type-safe, and performant alternative to TypeORM. The migration improves:

- **Performance:** Faster queries and smaller bundle size
- **Type Safety:** Better TypeScript inference
- **Developer Experience:** Simpler API and better tooling
- **Maintainability:** Less magic, more explicit code

**Status:** ✅ Core migration complete, services migration in progress

---

**Built with ❤️ using NestJS and Drizzle ORM**
