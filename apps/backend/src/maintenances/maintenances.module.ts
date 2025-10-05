import { Module } from '@nestjs/common';
import { MaintenancesService } from './maintenances.service';
import { MaintenancesController } from './maintenances.controller';

@Module({
  providers: [MaintenancesService],
  controllers: [MaintenancesController],
  exports: [MaintenancesService],
})
export class MaintenancesModule {}
