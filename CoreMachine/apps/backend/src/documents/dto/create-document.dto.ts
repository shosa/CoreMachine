import { IsUUID, IsEnum } from 'class-validator';
import { DocumentCategory } from '@prisma/client';

export class CreateDocumentDto {
  @IsUUID()
  machineId: string;

  @IsEnum(DocumentCategory)
  documentCategory: DocumentCategory;
}
