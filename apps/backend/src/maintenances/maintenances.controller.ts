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
import { MaintenancesService } from './maintenances.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('maintenances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenancesController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.tecnico)
  create(@Body() createMaintenanceDto: CreateMaintenanceDto) {
    return this.maintenancesService.create(createMaintenanceDto);
  }

  @Get()
  findAll(@Query('machineId') machineId?: string, @Query('operatorId') operatorId?: string) {
    return this.maintenancesService.findAll({ machineId, operatorId });
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.maintenancesService.search(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.maintenancesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.tecnico)
  update(@Param('id') id: string, @Body() updateMaintenanceDto: UpdateMaintenanceDto) {
    return this.maintenancesService.update(id, updateMaintenanceDto);
  }

  @Delete(':id')
  @Roles(UserRole.admin)
  remove(@Param('id') id: string) {
    return this.maintenancesService.remove(id);
  }
}
