import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
  Body,
  StreamableFile,
  Response,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response as ExpressResponse } from 'express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.tecnico)
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
    return this.documentsService.create(createDocumentDto, file, req.user.id);
  }

  @Get()
  findAll(@Query('machineId') machineId?: string) {
    return this.documentsService.findAll(machineId);
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.documentsService.search(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/download-url')
  async getDownloadUrl(@Param('id') id: string) {
    const url = await this.documentsService.getDownloadUrl(id);
    return { url };
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Response({ passthrough: true }) res: ExpressResponse) {
    const { stream, fileName, mimeType } = await this.documentsService.getFileStream(id);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    return new StreamableFile(stream);
  }

  @Delete(':id')
  @Roles(UserRole.admin)
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
