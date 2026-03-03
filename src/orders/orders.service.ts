import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { User } from '../entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { isValidStatusTransition } from './entities/order-status-transition';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(MenuItem)
    private menuItemRepository: Repository<MenuItem>,
  ) {}

  async create(createOrderDto: CreateOrderDto, currentUser: User): Promise<Order> {
    const { items, table_number, notes } = createOrderDto;

    // Validate menu items and calculate total
    const menuItemIds = items.map((item) => item.menu_item_id);
    const menuItems = await this.menuItemRepository.findByIds(menuItemIds);

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('One or more menu items not found');
    }

    // Verify all items belong to the same tenant
    const invalidItems = menuItems.filter((mi) => mi.tenant_id !== currentUser.tenant_id);
    if (invalidItems.length > 0) {
      throw new ForbiddenException('Cannot order items from different tenant');
    }

    // Calculate total and prepare order items
    let totalAmount = 0;
    const orderItems = items.map((item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menu_item_id);
      if (!menuItem) {
        throw new BadRequestException(`Menu item ${item.menu_item_id} not found`);
      }
      const itemTotal = Number(menuItem.price) * item.quantity;
      totalAmount += itemTotal;

      return {
        menu_item_id: menuItem.id,
        name: menuItem.name,
        quantity: item.quantity,
        price: Number(menuItem.price),
      };
    });

    const order = this.orderRepository.create({
      tenant_id: currentUser.tenant_id,
      created_by: currentUser.id,
      table_number,
      items: orderItems,
      total_amount: totalAmount,
      notes,
    });

    return this.orderRepository.save(order);
  }

  async findAll(queryDto: QueryOrderDto, currentUser: User): Promise<PaginatedResponse<Order>> {
    const { page = 1, limit = 10, status, tenant_id } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.orderRepository.createQueryBuilder('order');

    const filterTenantId = tenant_id || currentUser.tenant_id;
    queryBuilder.where('order.tenant_id = :tenant_id', { tenant_id: filterTenantId });

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    const [data, total] = await queryBuilder
      .leftJoinAndSelect('order.created_by_user', 'user')
      .skip(skip)
      .take(limit)
      .orderBy('order.created_at', 'DESC')
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

  async findOne(id: string, currentUser: User): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['tenant', 'created_by_user'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.tenant_id !== currentUser.tenant_id) {
      throw new ForbiddenException('Cannot access order from different tenant');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, currentUser: User): Promise<Order> {
    const order = await this.findOne(id, currentUser);
    Object.assign(order, updateOrderDto);
    return this.orderRepository.save(order);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const order = await this.findOne(id, currentUser);
    await this.orderRepository.remove(order);
  }

  async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto, currentUser: User): Promise<Order> {
    const order = await this.findOne(id, currentUser);
    const { status: newStatus } = updateStatusDto;

    // Validate status transition
    if (!isValidStatusTransition(order.status, newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${newStatus}`,
      );
    }

    // Log status transition
    console.log(
      `Order ${order.id} status changed from ${order.status} to ${newStatus} by user ${currentUser.email} (${currentUser.role})`,
    );

    order.status = newStatus;
    return this.orderRepository.save(order);
  }
}