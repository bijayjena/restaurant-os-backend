import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem } from '../entities/menu-item.entity';
import { User } from '../entities/user.entity';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { QueryMenuItemDto } from './dto/query-menu-item.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class MenuItemsService {
  constructor(
    @InjectRepository(MenuItem)
    private menuItemRepository: Repository<MenuItem>,
  ) {}

  async create(createMenuItemDto: CreateMenuItemDto, currentUser: User): Promise<MenuItem> {
    const menuItem = this.menuItemRepository.create({
      ...createMenuItemDto,
      tenant_id: currentUser.tenant_id,
    });

    return this.menuItemRepository.save(menuItem);
  }

  async findAll(queryDto: QueryMenuItemDto, currentUser: User): Promise<PaginatedResponse<MenuItem>> {
    const { page = 1, limit = 10, is_available, category, tenant_id } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.menuItemRepository.createQueryBuilder('menuItem');

    // Filter by tenant_id (use provided or current user's tenant)
    const filterTenantId = tenant_id || currentUser.tenant_id;
    queryBuilder.where('menuItem.tenant_id = :tenant_id', { tenant_id: filterTenantId });

    if (is_available !== undefined) {
      queryBuilder.andWhere('menuItem.is_available = :is_available', { is_available });
    }

    if (category) {
      queryBuilder.andWhere('menuItem.category = :category', { category });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('menuItem.created_at', 'DESC')
      .getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: User): Promise<MenuItem> {
    const menuItem = await this.menuItemRepository.findOne({
      where: { id },
      relations: ['tenant'],
    });

    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }

    if (menuItem.tenant_id !== currentUser.tenant_id) {
      throw new ForbiddenException('Cannot access menu item from different tenant');
    }

    return menuItem;
  }

  async update(id: string, updateMenuItemDto: UpdateMenuItemDto, currentUser: User): Promise<MenuItem> {
    const menuItem = await this.findOne(id, currentUser);
    Object.assign(menuItem, updateMenuItemDto);
    return this.menuItemRepository.save(menuItem);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const menuItem = await this.findOne(id, currentUser);
    await this.menuItemRepository.remove(menuItem);
  }
}
