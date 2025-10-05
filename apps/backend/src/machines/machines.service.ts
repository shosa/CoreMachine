import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MeilisearchService } from '../meilisearch/meilisearch.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';

@Injectable()
export class MachinesService {
  constructor(
    private prisma: PrismaService,
    private meilisearch: MeilisearchService,
    private configService: ConfigService,
  ) {}

  async create(createMachineDto: CreateMachineDto) {
    // Verify type exists
    const type = await this.prisma.type.findUnique({
      where: { id: createMachineDto.typeId },
    });

    if (!type) {
      throw new NotFoundException('Type not found');
    }

    // Check for duplicate serial number
    const existing = await this.prisma.machine.findUnique({
      where: { serialNumber: createMachineDto.serialNumber },
    });

    if (existing) {
      throw new ConflictException('Serial number already exists');
    }

    const machine = await this.prisma.machine.create({
      data: createMachineDto,
      include: {
        type: {
          include: {
            category: true,
          },
        },
      },
    });

    // Index in Meilisearch
    await this.meilisearch.indexMachine(machine);

    return machine;
  }

  async findAll(filters?: { typeId?: string; categoryId?: string }) {
    const where: any = {};

    if (filters?.typeId) {
      where.typeId = filters.typeId;
    }

    if (filters?.categoryId) {
      where.type = {
        categoryId: filters.categoryId,
      };
    }

    return this.prisma.machine.findMany({
      where,
      include: {
        type: {
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            documents: true,
            maintenances: true,
            scheduledMaintenances: true,
          },
        },
      },
      orderBy: { serialNumber: 'asc' },
    });
  }

  async findOne(id: string) {
    const machine = await this.prisma.machine.findUnique({
      where: { id },
      include: {
        type: {
          include: {
            category: true,
          },
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        maintenances: {
          orderBy: { date: 'desc' },
          take: 10,
          include: {
            operator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        scheduledMaintenances: {
          where: { isActive: true },
          orderBy: { nextDueDate: 'asc' },
        },
      },
    });

    if (!machine) {
      throw new NotFoundException('Machine not found');
    }

    return machine;
  }

  async update(id: string, updateMachineDto: UpdateMachineDto) {
    await this.findOne(id);

    if (updateMachineDto.typeId) {
      const type = await this.prisma.type.findUnique({
        where: { id: updateMachineDto.typeId },
      });

      if (!type) {
        throw new NotFoundException('Type not found');
      }
    }

    if (updateMachineDto.serialNumber) {
      const existing = await this.prisma.machine.findUnique({
        where: { serialNumber: updateMachineDto.serialNumber },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Serial number already exists');
      }
    }

    const machine = await this.prisma.machine.update({
      where: { id },
      data: updateMachineDto,
      include: {
        type: {
          include: {
            category: true,
          },
        },
      },
    });

    // Update in Meilisearch
    await this.meilisearch.indexMachine(machine);

    return machine;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.machine.delete({
      where: { id },
    });

    // Remove from Meilisearch
    await this.meilisearch.deleteMachine(id);

    return { message: 'Machine deleted successfully' };
  }

  async generateQRCode(id: string): Promise<string> {
    await this.findOne(id);

    const appUrl = this.configService.get<string>('APP_URL');
    const qrUrl = `${appUrl}/m/${id}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
    });

    return qrCodeDataUrl;
  }

  async search(query: string) {
    return this.meilisearch.searchMachines(query);
  }
}
