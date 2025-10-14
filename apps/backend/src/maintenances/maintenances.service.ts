import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { DocumentCategory } from '@prisma/client';

@Injectable()
export class MaintenancesService {
  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
  ) {}

  async create(createMaintenanceDto: CreateMaintenanceDto, documents?: any[], uploadedById?: string) {
    console.log('MaintenanceService.create called with documents:', documents?.length || 0);

    // Verify machine exists
    const machine = await this.prisma.machine.findUnique({
      where: { id: createMaintenanceDto.machineId },
    });

    if (!machine) {
      throw new NotFoundException('Machine not found');
    }

    // Create maintenance first
    const maintenance = await this.prisma.maintenance.create({
      data: createMaintenanceDto,
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
        documents: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    console.log('Maintenance created:', maintenance.id);

    // Upload documents if provided
    if (documents && documents.length > 0 && uploadedById) {
      console.log('Uploading', documents.length, 'documents...');

      const documentPromises = documents.map(async (file, index) => {
        console.log(`Uploading document ${index + 1}:`, file.originalname, file.size);
        const { filePath, fileName } = await this.minio.uploadFile(file, 'maintenance-documents');

        console.log(`Document ${index + 1} uploaded to:`, filePath);

        return this.prisma.document.create({
          data: {
            maintenanceId: maintenance.id,
            fileName,
            filePath,
            fileSize: file.size,
            mimeType: file.mimetype,
            documentCategory: DocumentCategory.altro, // Default category for maintenance documents
            uploadedById,
          },
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });
      });

      const uploadedDocuments = await Promise.all(documentPromises);
      console.log('All documents uploaded successfully:', uploadedDocuments.length);

      // Update maintenance with documents
      maintenance.documents = uploadedDocuments;
    } else {
      console.log('No documents to upload or no uploadedById');
    }

    return maintenance;
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
        documents: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
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
        documents: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!maintenance) {
      throw new NotFoundException('Maintenance not found');
    }

    return maintenance;
  }

  async update(id: string, updateMaintenanceDto: UpdateMaintenanceDto, documents?: any[], uploadedById?: string) {
    await this.findOne(id);

    if (updateMaintenanceDto.machineId) {
      const machine = await this.prisma.machine.findUnique({
        where: { id: updateMaintenanceDto.machineId },
      });

      if (!machine) {
        throw new NotFoundException('Machine not found');
      }
    }

    const maintenance = await this.prisma.maintenance.update({
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
        documents: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Upload additional documents if provided
    if (documents && documents.length > 0 && uploadedById) {
      const documentPromises = documents.map(async (file) => {
        const { filePath, fileName } = await this.minio.uploadFile(file, 'maintenance-documents');

        return this.prisma.document.create({
          data: {
            maintenanceId: maintenance.id,
            fileName,
            filePath,
            fileSize: file.size,
            mimeType: file.mimetype,
            documentCategory: DocumentCategory.altro, // Default category for maintenance documents
            uploadedById,
          },
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });
      });

      const uploadedDocuments = await Promise.all(documentPromises);

      // Add new documents to the maintenance response
      maintenance.documents = [...(maintenance.documents || []), ...uploadedDocuments];
    }

    return maintenance;
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
      documents: [], // Include empty documents array for consistency
    }));
  }
}
