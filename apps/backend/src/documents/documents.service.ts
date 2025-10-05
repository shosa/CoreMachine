import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
  ) {}

  async create(createDocumentDto: CreateDocumentDto, file: any, uploadedById: string) {
    // Verify machine exists
    const machine = await this.prisma.machine.findUnique({
      where: { id: createDocumentDto.machineId },
    });

    if (!machine) {
      throw new NotFoundException('Machine not found');
    }

    // Upload to MinIO
    const { filePath, fileName } = await this.minio.uploadFile(file, 'documents');

    // Save metadata to database
    return this.prisma.document.create({
      data: {
        machineId: createDocumentDto.machineId,
        fileName,
        filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        documentCategory: createDocumentDto.documentCategory,
        uploadedById,
      },
      include: {
        machine: {
          select: {
            id: true,
            serialNumber: true,
            description: true,
          },
        },
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
  }

  async findAll(machineId?: string) {
    const where = machineId ? { machineId } : {};

    return this.prisma.document.findMany({
      where,
      include: {
        machine: {
          select: {
            id: true,
            serialNumber: true,
            description: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({
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

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async getDownloadUrl(id: string): Promise<string> {
    const document = await this.findOne(id);
    return this.minio.getFileUrl(document.filePath);
  }

  async getFileStream(id: string) {
    const document = await this.findOne(id);
    return {
      stream: await this.minio.getFileStream(document.filePath),
      fileName: document.fileName,
      mimeType: document.mimeType,
    };
  }

  async remove(id: string) {
    const document = await this.findOne(id);

    // Delete from MinIO
    await this.minio.deleteFile(document.filePath);

    // Delete from database
    await this.prisma.document.delete({
      where: { id },
    });

    return { message: 'Document deleted successfully' };
  }
}
