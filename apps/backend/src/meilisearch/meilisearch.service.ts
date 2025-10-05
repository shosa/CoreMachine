import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch } from 'meilisearch';

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private client: MeiliSearch;
  private readonly indexName = 'machines';

  constructor(private configService: ConfigService) {
    this.client = new MeiliSearch({
      host: this.configService.get<string>('MEILISEARCH_HOST') || 'http://localhost:7700',
      apiKey: this.configService.get<string>('MEILISEARCH_API_KEY') || '',
    });
  }

  async onModuleInit() {
    try {
      // Create or get index
      await this.client.getIndex(this.indexName).catch(async () => {
        await this.client.createIndex(this.indexName, { primaryKey: 'id' });
      });

      // Configure searchable attributes
      const index = this.client.index(this.indexName);
      await index.updateSearchableAttributes([
        'serialNumber',
        'description',
        'manufacturer',
        'model',
        'dealer',
        'invoiceReference',
      ]);

      await index.updateFilterableAttributes(['typeId', 'categoryId']);

      console.log('✅ Meilisearch index configured');
    } catch (error) {
      console.error('❌ Meilisearch initialization error:', (error as any).message);
    }
  }

  async indexMachine(machine: any) {
    try {
      const index = this.client.index(this.indexName);
      await index.addDocuments([
        {
          id: machine.id,
          serialNumber: machine.serialNumber,
          description: machine.description,
          manufacturer: machine.manufacturer,
          model: machine.model,
          dealer: machine.dealer,
          invoiceReference: machine.invoiceReference,
          typeId: machine.typeId,
          categoryId: machine.type?.categoryId,
        },
      ]);
    } catch (error) {
      console.error('Meilisearch indexing error:', (error as any).message);
    }
  }

  async deleteMachine(machineId: string) {
    try {
      const index = this.client.index(this.indexName);
      await index.deleteDocument(machineId);
    } catch (error) {
      console.error('Meilisearch delete error:', (error as any).message);
    }
  }

  async searchMachines(query: string, filters?: { typeId?: string; categoryId?: string }) {
    try {
      const index = this.client.index(this.indexName);

      const filterArray: string[] = [];
      if (filters?.typeId) filterArray.push(`typeId = ${filters.typeId}`);
      if (filters?.categoryId) filterArray.push(`categoryId = ${filters.categoryId}`);

      const result = await index.search(query, {
        filter: filterArray.length > 0 ? filterArray : undefined,
        limit: 50,
      });

      return result.hits;
    } catch (error) {
      console.error('Meilisearch search error:', (error as any).message);
      return [];
    }
  }
}
