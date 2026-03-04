import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { MenuItem } from '../entities/menu-item.entity';
import { Tenant } from '../entities/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItem, Tenant])],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
