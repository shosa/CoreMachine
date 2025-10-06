import { PrismaClient } from '@prisma/client';
import { MeiliSearch } from 'meilisearch';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();
const meilisearch = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY || '',
});

async function reindexMachines() {
  try {
    console.log('🔄 Starting reindexing process...');

    // Fetch all machines from database
    const machines = await prisma.machine.findMany({
      include: {
        type: {
          include: {
            category: true,
          },
        },
      },
    });

    console.log(`📊 Found ${machines.length} machines to index`);

    if (machines.length === 0) {
      console.log('⚠️  No machines to index');
      return;
    }

    // Prepare documents for Meilisearch
    const documents = machines.map((machine) => ({
      id: machine.id,
      serialNumber: machine.serialNumber,
      description: machine.description,
      manufacturer: machine.manufacturer,
      model: machine.model,
      dealer: machine.dealer || '',
      invoiceReference: machine.invoiceReference || '',
      typeId: machine.typeId,
      categoryId: machine.type?.categoryId || '',
    }));

    // Get or create index
    const indexName = 'machines';
    let index;
    try {
      index = await meilisearch.getIndex(indexName);
      console.log(`✅ Found existing index: ${indexName}`);
    } catch (error) {
      console.log(`📝 Creating new index: ${indexName}`);
      await meilisearch.createIndex(indexName, { primaryKey: 'id' });
      index = meilisearch.index(indexName);
    }

    // Configure searchable attributes
    await index.updateSearchableAttributes([
      'serialNumber',
      'description',
      'manufacturer',
      'model',
      'dealer',
      'invoiceReference',
    ]);

    await index.updateFilterableAttributes(['typeId', 'categoryId']);

    console.log('⚙️  Index configuration updated');

    // Delete all existing documents and add new ones
    await index.deleteAllDocuments();
    console.log('🗑️  Cleared existing documents');

    // Add documents
    const task = await index.addDocuments(documents);
    console.log(`📥 Adding ${documents.length} documents...`);

    // Wait for indexing to complete
    await index.waitForTask(task.taskUid);

    console.log('✅ Reindexing completed successfully!');
    console.log(`📊 Total documents indexed: ${documents.length}`);

    // Show some stats
    const stats = await index.getStats();
    console.log(`📈 Index stats:`, {
      numberOfDocuments: stats.numberOfDocuments,
      isIndexing: stats.isIndexing,
    });
  } catch (error) {
    console.error('❌ Error during reindexing:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
reindexMachines()
  .then(() => {
    console.log('🎉 Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
