import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('public/machines')
export class MachinesPublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const machine = await this.prisma.machine.findUnique({
      where: { id },
      select: {
        id: true,
        serialNumber: true,
        description: true,
        manufacturer: true,
        model: true,
        yearBuilt: true,
        type: {
          select: {
            name: true,
            category: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!machine) throw new NotFoundException('Machine not found');
    return machine;
  }

  @Get(':id/maintenances')
  async getMaintenances(@Param('id') id: string) {
    const machine = await this.prisma.machine.findUnique({ where: { id } });
    if (!machine) throw new NotFoundException('Machine not found');

    return this.prisma.maintenance.findMany({
      where: { machineId: id, status: 'confirmed' },
      select: {
        id: true,
        date: true,
        type: true,
        problemDescription: true,
        workPerformed: true,
        createdAt: true,
      },
      orderBy: { date: 'desc' },
      take: 50,
    });
  }
}
