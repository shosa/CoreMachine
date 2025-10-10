import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { MaintenanceFrequency } from '@prisma/client';

export class CreateScheduledMaintenanceDto {
  @IsUUID()
  machineId: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(MaintenanceFrequency)
  frequency: MaintenanceFrequency;

  @IsDateString()
  nextDueDate: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  notificationDaysBefore?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
