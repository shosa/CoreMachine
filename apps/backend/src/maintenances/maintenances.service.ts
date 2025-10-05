import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';

@Injectable()
export class MaintenancesService {
  constructor(private prisma: PrismaService) {}

  async create(createMaintenanceDto: CreateMaintenanceDto, operatorId: string) {
    // Verify machine exists
    const machine = await this.prisma.machine.findUnique({
      where: { id: createMaintenanceDto.machineId },
    });

    if (!machine) {
      throw new NotFoundException('Machine not found');
    }

    return this.prisma.maintenance.create({
      data: {
        ...createMaintenanceDto,
        operatorId,
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
        operator: {
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

  async findAll(filters?: { machineId?: string; operatorId?: string }) {
    const where: any = {};

    if (filters?.machineId) {
      where.machineId = filters.machineId;
    }

    if (filters?.operatorId) {
      where.operatorId = filters.operatorId;
    }

    return this.prisma.maintenance.findMany({
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
        operator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const maintenance = await this.prisma.maintenance.findUnique({
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
        operator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!maintenance) {
      throw new NotFoundException('Maintenance not found');
    }

    return maintenance;
  }

  async update(id: string, updateMaintenanceDto: UpdateMaintenanceDto) {
    await this.findOne(id);

    if (updateMaintenanceDto.machineId) {
      const machine = await this.prisma.machine.findUnique({
        where: { id: updateMaintenanceDto.machineId },
      });

      if (!machine) {
        throw new NotFoundException('Machine not found');
      }
    }

    return this.prisma.maintenance.update({
      where: { id },
      data: updateMaintenanceDto,
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
        operator: {
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

    await this.prisma.maintenance.delete({
      where: { id },
    });

    return { message: 'Maintenance deleted successfully' };
  }
}
