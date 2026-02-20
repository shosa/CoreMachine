import { IsString, IsUUID, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { MaintenanceType } from '@prisma/client';

export class CreateDraftMaintenanceDto {
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
  mobileNote?: string;
}
