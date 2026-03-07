import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as schema from '../drizzle/schema';
import { DRIZZLE_ORM } from '../drizzle/drizzle.module';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE_ORM) private db: NodePgDatabase<typeof schema>,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, tenant_id, first_name, last_name, phone, role } = signupDto;

    // Check if user already exists
    const existingUsers = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existingUsers.length > 0) {
      throw new ConflictException('User with this email already exists');
    }

    // Verify tenant exists
    const tenantResults = await this.db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.id, tenant_id))
      .limit(1);

    if (tenantResults.length === 0) {
      throw new BadRequestException('Tenant not found');
    }

    const tenant = tenantResults[0];
    if (!tenant.isActive) {
      throw new BadRequestException('Tenant is not active');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUsers = await this.db
      .insert(schema.users)
      .values({
        email,
        password: hashedPassword,
        tenantId: tenant_id,
        role: role || schema.UserRole.WAITER,
      })
      .returning();

    const savedUser = newUsers[0];

    // Create profile
    await this.db.insert(schema.profiles).values({
      userId: savedUser.id,
      firstName: first_name,
      lastName: last_name,
      phone,
    });

    // Generate token
    const token = this.generateToken(savedUser);

    return {
      access_token: token,
      user: this.sanitizeUser(savedUser),
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user with tenant
    const userResults = await this.db
      .select({
        user: schema.users,
        tenant: schema.tenants,
      })
      .from(schema.users)
      .leftJoin(schema.tenants, eq(schema.users.tenantId, schema.tenants.id))
      .where(eq(schema.users.email, email))
      .limit(1);

    if (userResults.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { user, tenant } = userResults[0];

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('Tenant account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user);

    return {
      access_token: token,
      user: this.sanitizeUser(user),
    };
  }

  async getMe(userId: string) {
    const userResults = await this.db
      .select({
        user: schema.users,
        tenant: schema.tenants,
      })
      .from(schema.users)
      .leftJoin(schema.tenants, eq(schema.users.tenantId, schema.tenants.id))
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (userResults.length === 0) {
      throw new UnauthorizedException('User not found');
    }

    const { user, tenant } = userResults[0];

    // Get profiles
    const profiles = await this.db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, userId));

    return {
      ...this.sanitizeUser(user),
      tenant,
      profiles,
    };
  }

  async findUserById(userId: string) {
    const userResults = await this.db
      .select({
        user: schema.users,
        tenant: schema.tenants,
      })
      .from(schema.users)
      .leftJoin(schema.tenants, eq(schema.users.tenantId, schema.tenants.id))
      .where(and(eq(schema.users.id, userId), eq(schema.users.isActive, true)))
      .limit(1);

    if (userResults.length === 0) {
      return null;
    }

    return { ...userResults[0].user, tenant: userResults[0].tenant };
  }

  private generateToken(user: schema.User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenantId,
    };

    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: schema.User) {
    const { password, ...result } = user;
    return result;
  }
}
