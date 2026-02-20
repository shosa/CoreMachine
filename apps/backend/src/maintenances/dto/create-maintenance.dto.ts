import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { MaintenanceType } from '@prisma/client';

export class CreateMaintenanceDto {
  @IsUUID()
  machineId: string;

  @IsUUID()
  operatorId: string;

  @IsDateString()
  date: string;

  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @IsString()
  @IsOptional()
  problemDescription?: string;

  @IsString()
  workPerformed: string;

  @IsString()
  @IsOptional()
  spareParts?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseFloat(value) : undefined))
  @IsNumber()
  @Min(0)
  cost?: number;
}
