import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduledMaintenanceDto } from './create-scheduled-maintenance.dto';

export class UpdateScheduledMaintenanceDto extends PartialType(CreateScheduledMaintenanceDto) {}
