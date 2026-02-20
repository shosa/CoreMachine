import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('public/documents')
export class DocumentsPublicController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('machine/:machineId')
  async getByMachine(@Param('machineId') machineId: string) {
    const docs = await this.prisma.document.findMany({
      where: { machineId },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        documentCategory: true,
        uploadedAt: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });
    return docs;
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const { stream, fileName, mimeType } = await this.documentsService.getFileStream(id);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    stream.pipe(res);
  }
}
