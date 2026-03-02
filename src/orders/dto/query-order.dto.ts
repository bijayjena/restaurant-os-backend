import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { OrderStatus } from '../../entities/order.entity';

export class QueryOrderDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  tenant_id?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
