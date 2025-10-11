import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { MaintenanceType } from '@prisma/client';

export class CreateMaintenanceDto {
  @IsUUID()
  machineId: string;

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

  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;
}
