import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DocumentsPublicController } from './documents-public.controller';
import { MinioModule } from '../minio/minio.module';

@Module({
  imports: [MinioModule],
  providers: [DocumentsService],
  controllers: [DocumentsController, DocumentsPublicController],
  exports: [DocumentsService],
})
export class DocumentsModule {}
