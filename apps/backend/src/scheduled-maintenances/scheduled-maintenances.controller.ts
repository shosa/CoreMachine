import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ScheduledMaintenancesService } from './scheduled-maintenances.service';
import { CreateScheduledMaintenanceDto } from './dto/create-scheduled-maintenance.dto';
import { UpdateScheduledMaintenanceDto } from './dto/update-scheduled-maintenance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('scheduled-maintenances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScheduledMaintenancesController {
  constructor(private readonly service: ScheduledMaintenancesService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.tecnico)
  create(@Body() createDto: CreateScheduledMaintenanceDto, @Request() req: any) {
    return this.service.create(createDto, req.user.id, req.user);
  }

  @Get()
  findAll(@Query('machineId') machineId?: string, @Query('isActive') isActive?: string) {
    const filters: any = { machineId };
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }
    return this.service.findAll(filters);
  }

  @Get('upcoming')
  findUpcoming(@Query('days') days?: string) {
    return this.service.findUpcoming(days ? parseInt(days, 10) : 30);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.tecnico)
  update(@Param('id') id: string, @Body() updateDto: UpdateScheduledMaintenanceDto, @Request() req: any) {
    return this.service.update(id, updateDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.admin)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user);
  }
}
