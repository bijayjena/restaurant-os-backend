import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Tenant } from './tenant.entity';
import { Profile } from './profile.entity';
import { Order } from './order.entity';

export enum UserRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  KITCHEN = 'kitchen',
  WAITER = 'waiter',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.WAITER,
  })
  role: UserRole;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => Profile, (profile) => profile.user)
  profiles: Profile[];

  @OneToMany(() => Order, (order) => order.created_by_user)
  orders: Order[];
}
