import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  KITCHEN = 'kitchen',
  WAITER = 'waiter',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
