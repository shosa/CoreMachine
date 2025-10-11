import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  getDashboardStats() {
    return this.statsService.getDashboardStats();
  }

  @Get('maintenance-trends')
  getMaintenanceTrends() {
    return this.statsService.getMaintenanceTrends();
  }

  @Get('type-analysis')
  getTypeAnalysis() {
    return this.statsService.getTypeAnalysis();
  }

  @Get('machine-health')
  getMachineHealth() {
    return this.statsService.getMachineHealth();
  }
}
