import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Minio.Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME') || 'coremachine-files';

    this.client = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT') || 'localhost',
      port: parseInt(this.configService.get<string>('MINIO_PORT') || '9000', 10),
      useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin',
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName, 'us-east-1');
        console.log(`✅ MinIO bucket '${this.bucketName}' created`);
      } else {
        console.log(`✅ MinIO bucket '${this.bucketName}' already exists`);
      }
    } catch (error) {
      console.error('❌ MinIO initialization error:', (error as any).message);
    }
  }

  async uploadFile(
    file: any,
    folder: string = 'documents',
  ): Promise<{ filePath: string; fileName: string }> {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `${folder}/${fileName}`;

    await this.client.putObject(this.bucketName, filePath, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    return { filePath, fileName: file.originalname };
  }

  async deleteFile(filePath: string): Promise<void> {
    await this.client.removeObject(this.bucketName, filePath);
  }

  async getFileUrl(filePath: string, expirySeconds: number = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucketName, filePath, expirySeconds);
  }

  async getFileStream(filePath: string): Promise<any> {
    return this.client.getObject(this.bucketName, filePath);
  }
}
