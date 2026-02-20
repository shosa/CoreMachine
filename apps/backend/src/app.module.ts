import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { TypesModule } from './types/types.module';
import { MachinesModule } from './machines/machines.module';
import { MaintenancesModule } from './maintenances/maintenances.module';
import { ScheduledMaintenancesModule } from './scheduled-maintenances/scheduled-maintenances.module';
import { DocumentsModule } from './documents/documents.module';
import { MinioModule } from './minio/minio.module';
import { MeilisearchModule } from './meilisearch/meilisearch.module';
import { StatsModule } from './stats/stats.module';
import { PrinterModule } from './printer/printer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    TypesModule,
    MachinesModule,
    MaintenancesModule,
    ScheduledMaintenancesModule,
    DocumentsModule,
    MinioModule,
    MeilisearchModule,
    StatsModule,
    PrinterModule,
  ],
})
export class AppModule {}
