import {
  IsString,
  MinLength,
  IsUUID,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

export class CreateMachineDto {
  @IsUUID()
  typeId: string;

  @IsString()
  @MinLength(1)
  serialNumber: string;

  @IsString()
  @MinLength(2)
  description: string;

  @IsString()
  @MinLength(2)
  manufacturer: string;

  @IsString()
  @MinLength(1)
  model: string;

  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  @IsOptional()
  yearBuilt?: number;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @IsString()
  @IsOptional()
  dealer?: string;

  @IsString()
  @IsOptional()
  invoiceReference?: string;

  @IsString()
  @IsOptional()
  documentLocation?: string;
}
