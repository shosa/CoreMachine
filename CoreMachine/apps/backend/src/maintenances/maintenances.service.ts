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

  async search(query: string) {
    if (!query || query.length < 2) {
      return [];
    }

    const searchPattern = `%${query}%`;

    // Use raw SQL for case-insensitive search in MySQL
    const results = await this.prisma.$queryRaw`
      SELECT
        maint.id,
        maint.date,
        maint.type,
        maint.problem_description as problemDescription,
        maint.work_performed as workPerformed,
        maint.spare_parts as spareParts,
        maint.cost,
        m.id as machineId,
        m.serial_number as machineSerialNumber,
        m.description as machineDescription,
        u.id as operatorId,
        u.first_name as operatorFirstName,
        u.last_name as operatorLastName
      FROM maintenances maint
      LEFT JOIN machines m ON maint.machine_id = m.id
      LEFT JOIN users u ON maint.operator_id = u.id
      WHERE
        maint.work_performed LIKE ${searchPattern}
        OR maint.problem_description LIKE ${searchPattern}
        OR maint.spare_parts LIKE ${searchPattern}
        OR m.serial_number LIKE ${searchPattern}
        OR m.description LIKE ${searchPattern}
        OR m.manufacturer LIKE ${searchPattern}
        OR m.model LIKE ${searchPattern}
      ORDER BY maint.date DESC
      LIMIT 10
    `;

    // Transform results to match expected format
    return (results as any[]).map((row) => ({
      id: row.id,
      date: row.date,
      type: row.type,
      problemDescription: row.problemDescription,
      workPerformed: row.workPerformed,
      spareParts: row.spareParts,
      cost: row.cost,
      machine: {
        id: row.machineId,
        serialNumber: row.machineSerialNumber,
        description: row.machineDescription,
      },
      operator: {
        id: row.operatorId,
        firstName: row.operatorFirstName,
        lastName: row.operatorLastName,
      },
    }));
  }
}
