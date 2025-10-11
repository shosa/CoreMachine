import { IsString, MinLength, IsUUID, IsOptional } from 'class-validator';

export class CreateTypeDto {
  @IsUUID()
  categoryId: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
