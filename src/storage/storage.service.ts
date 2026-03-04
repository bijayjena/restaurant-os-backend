import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { MenuItem } from '../entities/menu-item.entity';
import { Tenant } from '../entities/tenant.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class StorageService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  constructor(
    @InjectRepository(MenuItem)
    private menuItemRepository: Repository<MenuItem>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {
    this.ensureUploadDirExists();
  }

  private ensureUploadDirExists() {
    const dirs = [
      this.uploadDir,
      path.join(this.uploadDir, 'menu-items'),
      path.join(this.uploadDir, 'tenants'),
    ];

    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit`);
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }
  }

  generateFileName(originalName: string, prefix: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(originalName);
    return `${prefix}-${timestamp}-${randomString}${ext}`;
  }

  async uploadMenuItemImage(
    file: Express.Multer.File,
    menuItemId: string,
    currentUser: User,
  ): Promise<string> {
    this.validateFile(file);

    const menuItem = await this.menuItemRepository.findOne({
      where: { id: menuItemId },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    if (menuItem.tenant_id !== currentUser.tenant_id) {
      throw new BadRequestException('Cannot upload image for menu item from different tenant');
    }

    // Delete old image if exists
    if (menuItem.image) {
      this.deleteFile(menuItem.image);
    }

    const fileName = this.generateFileName(file.originalname, 'menu-item');
    const filePath = path.join(this.uploadDir, 'menu-items', fileName);

    fs.writeFileSync(filePath, file.buffer);

    const fileUrl = `/uploads/menu-items/${fileName}`;
    menuItem.image = fileUrl;
    await this.menuItemRepository.save(menuItem);

    return fileUrl;
  }


  async uploadTenantLogo(
    file: Express.Multer.File,
    tenantId: string,
    currentUser: User,
  ): Promise<string> {
    this.validateFile(file);

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.id !== currentUser.tenant_id) {
      throw new BadRequestException('Cannot upload logo for different tenant');
    }

    // Delete old logo if exists
    if (tenant.logo) {
      this.deleteFile(tenant.logo);
    }

    const fileName = this.generateFileName(file.originalname, 'tenant-logo');
    const filePath = path.join(this.uploadDir, 'tenants', fileName);

    fs.writeFileSync(filePath, file.buffer);

    const fileUrl = `/uploads/tenants/${fileName}`;
    tenant.logo = fileUrl;
    await this.tenantRepository.save(tenant);

    return fileUrl;
  }

  deleteFile(fileUrl: string) {
    try {
      const filePath = path.join(process.cwd(), fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete file: ${fileUrl}`, error);
    }
  }

  async deleteMenuItemImage(menuItemId: string, currentUser: User): Promise<void> {
    const menuItem = await this.menuItemRepository.findOne({
      where: { id: menuItemId },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    if (menuItem.tenant_id !== currentUser.tenant_id) {
      throw new BadRequestException('Cannot delete image for menu item from different tenant');
    }

    if (menuItem.image) {
      this.deleteFile(menuItem.image);
      menuItem.image = null;
      await this.menuItemRepository.save(menuItem);
    }
  }

  async deleteTenantLogo(tenantId: string, currentUser: User): Promise<void> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.id !== currentUser.tenant_id) {
      throw new BadRequestException('Cannot delete logo for different tenant');
    }

    if (tenant.logo) {
      this.deleteFile(tenant.logo);
      tenant.logo = null;
      await this.tenantRepository.save(tenant);
    }
  }
}
