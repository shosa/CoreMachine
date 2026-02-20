import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrinterService } from './printer.service';
import { IsString, IsUUID, IsOptional } from 'class-validator';

class PrintMachineLabelDto {
  @IsUUID()
  machineId: string;

  @IsString()
  serialNumber: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  appUrl: string;
}

@Controller('printer')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  @Post('machine-label')
  @Roles('admin', 'tecnico')
  @HttpCode(200)
  printMachineLabel(@Body() dto: PrintMachineLabelDto) {
    return this.printerService.printMachineLabel(
      dto.machineId,
      dto.serialNumber,
      dto.description || '',
      dto.manufacturer || '',
      dto.model || '',
      dto.appUrl,
    );
  }
}
