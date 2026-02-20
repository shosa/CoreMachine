import { Controller, Post, Body } from '@nestjs/common';
import { MaintenancesService } from './maintenances.service';
import { CreateDraftMaintenanceDto } from './dto/create-draft-maintenance.dto';

@Controller('public/maintenances')
export class MaintenancesPublicController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  @Post()
  createDraft(@Body() dto: CreateDraftMaintenanceDto) {
    return this.maintenancesService.createDraft(dto);
  }
}
