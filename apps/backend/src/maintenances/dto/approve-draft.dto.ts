import { IsString, IsUUID, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ApproveDraftDto {
  @IsUUID()
  operatorId: string;

  @IsString()
  @IsOptional()
  spareParts?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cost?: number;
}
