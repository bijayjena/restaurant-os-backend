import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';
import { Tenant } from '../entities/tenant.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, tenant_id, first_name, last_name, phone, role } = signupDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Verify tenant exists
    const tenant = await this.tenantRepository.findOne({ where: { id: tenant_id } });
    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    if (!tenant.is_active) {
      throw new BadRequestException('Tenant is not active');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      tenant_id,
      role: role || undefined,
    });

    const savedUser = await this.userRepository.save(user);

    // Create profile
    const profile = this.profileRepository.create({
      user_id: savedUser.id,
      first_name,
      last_name,
      phone,
    });

    await this.profileRepository.save(profile);

    // Generate token
    const token = this.generateToken(savedUser);

    return {
      access_token: token,
      user: this.sanitizeUser(savedUser),
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user with tenant relation
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['tenant'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('User account is inactive');
    }

    if (!user.tenant.is_active) {
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
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['tenant', 'profiles'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
    };

    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }
}
