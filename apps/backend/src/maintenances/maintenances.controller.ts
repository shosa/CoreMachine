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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(FilesInterceptor('documents'))
  create(
    @Body() createMaintenanceDto: CreateMaintenanceDto,
    @UploadedFiles() documents?: any[],
    @Request() req?: any,
  ) {
    console.log('MaintenanceController.create called');
    console.log('Documents received:', documents?.length || 0);
    console.log('User ID:', req?.user?.id);
    return this.maintenancesService.create(createMaintenanceDto, documents, req?.user?.id, req?.user);
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
  @UseInterceptors(FilesInterceptor('documents'))
  update(
    @Param('id') id: string,
    @Body() updateMaintenanceDto: UpdateMaintenanceDto,
    @UploadedFiles() documents?: any[],
    @Request() req?: any,
  ) {
    return this.maintenancesService.update(id, updateMaintenanceDto, documents, req?.user?.id, req?.user);
  }

  @Delete(':id')
  @Roles(UserRole.admin)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.maintenancesService.remove(id, req.user);
  }

  @Delete(':maintenanceId/documents/:documentId')
  @Roles(UserRole.admin, UserRole.tecnico)
  async removeDocument(
    @Param('maintenanceId') maintenanceId: string,
    @Param('documentId') documentId: string,
    @Request() req: any,
  ) {
    return this.maintenancesService.removeDocument(maintenanceId, documentId, req.user.id);
  }
}
