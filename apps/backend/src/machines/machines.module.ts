import { Module } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { MachinesController } from './machines.controller';
import { MachinesPublicController } from './machines-public.controller';
import { MeilisearchModule } from '../meilisearch/meilisearch.module';

@Module({
  imports: [MeilisearchModule],
  providers: [MachinesService],
  controllers: [MachinesController, MachinesPublicController],
  exports: [MachinesService],
})
export class MachinesModule {}
