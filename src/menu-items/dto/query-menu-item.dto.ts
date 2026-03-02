import { IsOptional, IsBoolean, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryMenuItemDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  tenant_id?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_available?: boolean;

  @IsOptional()
  @IsString()
  category?: string;
}
