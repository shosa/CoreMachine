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
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const normalized = String(value).replace(',', '.');
    const num = parseFloat(normalized);
    return isNaN(num) ? value : num;
  })
  @IsNumber()
  @Min(0)
  cost?: number;
}
