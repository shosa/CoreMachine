import { Module } from '@nestjs/common';
import { ScheduledMaintenancesService } from './scheduled-maintenances.service';
import { ScheduledMaintenancesController } from './scheduled-maintenances.controller';

@Module({
  providers: [ScheduledMaintenancesService],
  controllers: [ScheduledMaintenancesController],
  exports: [ScheduledMaintenancesService],
})
export class ScheduledMaintenancesModule {}
