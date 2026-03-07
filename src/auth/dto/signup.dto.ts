import { IsEmail, IsString, MinLength, IsEnum, IsUUID, IsOptional } from 'class-validator';

export enum UserRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  KITCHEN = 'kitchen',
  WAITER = 'waiter',
}

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsUUID()
  tenant_id: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
