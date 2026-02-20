import { Module } from '@nestjs/common';
import { MaintenancesService } from './maintenances.service';
import { MaintenancesController } from './maintenances.controller';
import { MaintenancesPublicController } from './maintenances-public.controller';

@Module({
  providers: [MaintenancesService],
  controllers: [MaintenancesController, MaintenancesPublicController],
  exports: [MaintenancesService],
})
export class MaintenancesModule {}
