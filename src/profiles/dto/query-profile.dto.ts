import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryProfileDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  user_id?: string;
}
