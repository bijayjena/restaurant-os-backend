import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateProfileDto {
  @IsUUID()
  user_id: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
