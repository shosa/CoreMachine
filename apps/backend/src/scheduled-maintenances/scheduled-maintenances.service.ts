import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduledMaintenanceDto } from './dto/create-scheduled-maintenance.dto';
import { UpdateScheduledMaintenanceDto } from './dto/update-scheduled-maintenance.dto';

@Injectable()
export class ScheduledMaintenancesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateScheduledMaintenanceDto, createdById: string) {
    // Verify machine exists
    const machine = await this.prisma.machine.findUnique({
      where: { id: createDto.machineId },
    });

    if (!machine) {
      throw new NotFoundException('Machine not found');
    }

    return this.prisma.scheduledMaintenance.create({
      data: {
        ...createDto,
        createdById,
      },
      include: {
        machine: {
          include: {
            type: {
              include: {
                category: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(filters?: { machineId?: string; isActive?: boolean }) {
    const where: any = {};

    if (filters?.machineId) {
      where.machineId = filters.machineId;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return this.prisma.scheduledMaintenance.findMany({
      where,
      include: {
        machine: {
          select: {
            id: true,
            serialNumber: true,
            description: true,
            manufacturer: true,
            model: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  async findUpcoming(days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.scheduledMaintenance.findMany({
      where: {
        isActive: true,
        nextDueDate: {
          lte: futureDate,
        },
      },
      include: {
        machine: {
          include: {
            type: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const scheduled = await this.prisma.scheduledMaintenance.findUnique({
      where: { id },
      include: {
        machine: {
          include: {
            type: {
              include: {
                category: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!scheduled) {
      throw new NotFoundException('Scheduled maintenance not found');
    }

    return scheduled;
  }

  async update(id: string, updateDto: UpdateScheduledMaintenanceDto) {
    await this.findOne(id);

    if (updateDto.machineId) {
      const machine = await this.prisma.machine.findUnique({
        where: { id: updateDto.machineId },
      });

      if (!machine) {
        throw new NotFoundException('Machine not found');
      }
    }

    return this.prisma.scheduledMaintenance.update({
      where: { id },
      data: updateDto,
      include: {
        machine: {
          include: {
            type: {
              include: {
                category: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.scheduledMaintenance.delete({
      where: { id },
    });

    return { message: 'Scheduled maintenance deleted successfully' };
  }
}
