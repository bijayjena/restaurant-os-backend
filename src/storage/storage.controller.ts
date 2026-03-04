import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../entities/user.entity';

@Controller('storage')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('menu-items/:id/image')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadMenuItemImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    const fileUrl = await this.storageService.uploadMenuItemImage(file, id, user);
    return {
      message: 'Image uploaded successfully',
      url: fileUrl,
    };
  }

  @Post('tenants/:id/logo')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadTenantLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    const fileUrl = await this.storageService.uploadTenantLogo(file, id, user);
    return {
      message: 'Logo uploaded successfully',
      url: fileUrl,
    };
  }

  @Delete('menu-items/:id/image')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMenuItemImage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.storageService.deleteMenuItemImage(id, user);
  }

  @Delete('tenants/:id/logo')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTenantLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.storageService.deleteTenantLogo(id, user);
  }
}
