import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper to generate random dates
function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper to get date X months ago
function monthsAgo(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
}

async function main() {
  console.log('🌱 Seeding database with comprehensive data...');

  // ==================== USERS ====================
  console.log('\n👥 Creating users...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@coremachine.com' },
    update: {},
    create: {
      email: 'admin@coremachine.com',
      password: hashedPassword,
      firstName: 'Giuseppe',
      lastName: 'Verdi',
      role: UserRole.admin,
      isActive: true,
    },
  });

  const tecnico1 = await prisma.user.upsert({
    where: { email: 'mario.rossi@coremachine.com' },
    update: {},
    create: {
      email: 'mario.rossi@coremachine.com',
      password: await bcrypt.hash('tecnico123', 10),
      firstName: 'Mario',
      lastName: 'Rossi',
      role: UserRole.tecnico,
      isActive: true,
    },
  });

  const tecnico2 = await prisma.user.upsert({
    where: { email: 'luca.bianchi@coremachine.com' },
    update: {},
    create: {
      email: 'luca.bianchi@coremachine.com',
      password: await bcrypt.hash('tecnico123', 10),
      firstName: 'Luca',
      lastName: 'Bianchi',
      role: UserRole.tecnico,
      isActive: true,
    },
  });

  const utente = await prisma.user.upsert({
    where: { email: 'anna.ferrari@coremachine.com' },
    update: {},
    create: {
      email: 'anna.ferrari@coremachine.com',
      password: await bcrypt.hash('utente123', 10),
      firstName: 'Anna',
      lastName: 'Ferrari',
      role: UserRole.utente,
      isActive: true,
    },
  });

  console.log('✅ Users created: 4');

  // ==================== CATEGORIES ====================
  console.log('\n📁 Creating categories...');

  const categoryCucitrici = await prisma.category.upsert({
    where: { name: 'CUCITRICI' },
    update: {},
    create: {
      name: 'CUCITRICI',
      description: 'Macchine cucitrici per assemblaggio materiali',
    },
  });

  const categoryPresse = await prisma.category.upsert({
    where: { name: 'PRESSE' },
    update: {},
    create: {
      name: 'PRESSE',
      description: 'Presse idrauliche e meccaniche',
    },
  });

  const categoryTaglio = await prisma.category.upsert({
    where: { name: 'TAGLIO' },
    update: {},
    create: {
      name: 'TAGLIO',
      description: 'Macchinari per il taglio di materiali',
    },
  });

  const categoryFinitura = await prisma.category.upsert({
    where: { name: 'FINITURA' },
    update: {},
    create: {
      name: 'FINITURA',
      description: 'Macchinari per finiture e lavorazioni di superficie',
    },
  });

  const categoryAutomazione = await prisma.category.upsert({
    where: { name: 'AUTOMAZIONE' },
    update: {},
    create: {
      name: 'AUTOMAZIONE',
      description: 'Sistemi automatizzati e robotizzati',
    },
  });

  console.log('✅ Categories created: 5');

  // ==================== TYPES ====================
  console.log('\n🏷️  Creating machine types...');

  const types = [
    // Cucitrici
    { category: categoryCucitrici, name: 'LINEARE', desc: 'Cucitrici lineari a punto diritto' },
    { category: categoryCucitrici, name: 'ZIGZAG', desc: 'Cucitrici a punto zigzag' },
    { category: categoryCucitrici, name: 'RIBATTITRICE', desc: 'Macchine ribattitrici industriali' },

    // Presse
    { category: categoryPresse, name: 'A COLONNA', desc: 'Presse idrauliche a colonna' },
    { category: categoryPresse, name: 'ECCENTRICA', desc: 'Presse eccentriche meccaniche' },
    { category: categoryPresse, name: 'PNEUMATICA', desc: 'Presse pneumatiche' },

    // Taglio
    { category: categoryTaglio, name: 'FUSTELLA', desc: 'Macchine fustellatrici' },
    { category: categoryTaglio, name: 'TRANCIATRICE', desc: 'Tranciatrici a lama' },
    { category: categoryTaglio, name: 'LASER', desc: 'Sistemi di taglio laser' },

    // Finitura
    { category: categoryFinitura, name: 'SPAZZOLATRICE', desc: 'Spazzolatrici per finitura' },
    { category: categoryFinitura, name: 'LUCIDATRICE', desc: 'Lucidatrici industriali' },

    // Automazione
    { category: categoryAutomazione, name: 'ROBOT ANTROPOMORFO', desc: 'Robot antropomorfi a 6 assi' },
    { category: categoryAutomazione, name: 'NASTRO TRASPORTATORE', desc: 'Sistemi di trasporto automatizzato' },
  ];

  const createdTypes: any[] = [];
  for (const type of types) {
    const created = await prisma.type.upsert({
      where: {
        categoryId_name: {
          categoryId: type.category.id,
          name: type.name,
        },
      },
      update: {},
      create: {
        categoryId: type.category.id,
        name: type.name,
        description: type.desc,
      },
    });
    createdTypes.push(created);
  }

  console.log(`✅ Machine types created: ${createdTypes.length}`);

  // ==================== MACHINES ====================
  console.log('\n🏭 Creating machines...');

  const machinesData = [
    // Cucitrici
    { type: 0, serial: 'CUC-LIN-001', desc: 'Cucitrice Lineare Principale', mfr: 'JUKI', model: 'DDL-8700', year: 2020, price: new Date('2020-03-15') },
    { type: 0, serial: 'CUC-LIN-002', desc: 'Cucitrice Lineare Secondaria', mfr: 'JUKI', model: 'DDL-8700', year: 2021, price: new Date('2021-05-20') },
    { type: 0, serial: 'CUC-LIN-003', desc: 'Cucitrice Lineare Reparto A', mfr: 'BROTHER', model: 'S-7300A', year: 2019, price: new Date('2019-08-10') },
    { type: 1, serial: 'CUC-ZIG-001', desc: 'Cucitrice Zigzag Pesante', mfr: 'PFAFF', model: '1245', year: 2018, price: new Date('2018-11-05') },
    { type: 1, serial: 'CUC-ZIG-002', desc: 'Cucitrice Zigzag Leggera', mfr: 'SINGER', model: '20U', year: 2022, price: new Date('2022-02-14') },
    { type: 2, serial: 'RIB-001', desc: 'Ribattitrice Automatica', mfr: 'DURKOPP', model: '745', year: 2020, price: new Date('2020-09-22') },

    // Presse
    { type: 3, serial: 'PRE-COL-001', desc: 'Pressa Idraulica 50T', mfr: 'MECAMAQ', model: 'HYD-50', year: 2019, price: new Date('2019-04-12') },
    { type: 3, serial: 'PRE-COL-002', desc: 'Pressa Idraulica 100T', mfr: 'MECAMAQ', model: 'HYD-100', year: 2021, price: new Date('2021-06-30') },
    { type: 4, serial: 'PRE-ECC-001', desc: 'Pressa Eccentrica 40T', mfr: 'OMERA', model: 'PE-40', year: 2017, price: new Date('2017-12-08') },
    { type: 4, serial: 'PRE-ECC-002', desc: 'Pressa Eccentrica 80T', mfr: 'OMERA', model: 'PE-80', year: 2018, price: new Date('2018-03-25') },
    { type: 5, serial: 'PRE-PNE-001', desc: 'Pressa Pneumatica Rapida', mfr: 'FESTO', model: 'DSNU-25', year: 2022, price: new Date('2022-07-15') },

    // Taglio
    { type: 6, serial: 'TAG-FUS-001', desc: 'Fustellatrice Automatica', mfr: 'ATOM', model: 'SP-500', year: 2020, price: new Date('2020-01-18') },
    { type: 6, serial: 'TAG-FUS-002', desc: 'Fustellatrice Manuale', mfr: 'ATOM', model: 'SP-300', year: 2015, price: new Date('2015-10-22') },
    { type: 7, serial: 'TAG-TRA-001', desc: 'Tranciatrice Idraulica', mfr: 'COLGAR', model: 'CH-300', year: 2019, price: new Date('2019-09-14') },
    { type: 8, serial: 'TAG-LAS-001', desc: 'Taglio Laser Fibra', mfr: 'TRUMPF', model: 'TruLaser 3030', year: 2021, price: new Date('2021-11-05') },

    // Finitura
    { type: 9, serial: 'FIN-SPA-001', desc: 'Spazzolatrice Doppia', mfr: 'FICEP', model: 'SB-200', year: 2018, price: new Date('2018-05-30') },
    { type: 9, serial: 'FIN-SPA-002', desc: 'Spazzolatrice Singola', mfr: 'FICEP', model: 'SB-100', year: 2016, price: new Date('2016-08-12') },
    { type: 10, serial: 'FIN-LUC-001', desc: 'Lucidatrice Rotativa', mfr: 'COSTA', model: 'LR-450', year: 2020, price: new Date('2020-04-20') },

    // Automazione
    { type: 11, serial: 'AUT-ROB-001', desc: 'Robot Saldatura', mfr: 'ABB', model: 'IRB 2600', year: 2021, price: new Date('2021-03-10') },
    { type: 11, serial: 'AUT-ROB-002', desc: 'Robot Manipolazione', mfr: 'KUKA', model: 'KR 6 R900', year: 2022, price: new Date('2022-01-25') },
    { type: 12, serial: 'AUT-NAS-001', desc: 'Nastro Trasportatore Principale', mfr: 'TRANSNORM', model: 'TN-3000', year: 2019, price: new Date('2019-07-08') },
    { type: 12, serial: 'AUT-NAS-002', desc: 'Nastro Trasportatore Secondario', mfr: 'TRANSNORM', model: 'TN-2000', year: 2019, price: new Date('2019-07-08') },
  ];

  const machines: any[] = [];
  for (const machine of machinesData) {
    const created = await prisma.machine.create({
      data: {
        typeId: createdTypes[machine.type].id,
        serialNumber: machine.serial,
        description: machine.desc,
        manufacturer: machine.mfr,
        model: machine.model,
        yearBuilt: machine.year,
        purchaseDate: machine.price,
        dealer: ['Fornitore Macchinari SRL', 'Industrie Meccaniche SpA', 'TechMachinery Italia'][Math.floor(Math.random() * 3)],
        invoiceReference: `FT${machine.year}/${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        documentLocation: ['Archivio A', 'Archivio B', 'Armadio 3', 'Scaffale 12'][Math.floor(Math.random() * 4)],
      },
    });
    machines.push(created);
  }

  console.log(`✅ Machines created: ${machines.length}`);

  // ==================== MAINTENANCES ====================
  console.log('\n🔧 Creating maintenances...');

  const maintenanceTypes = ['ordinaria', 'straordinaria', 'guasto', 'riparazione'] as const;
  const workDescriptions = {
    ordinaria: [
      'Lubrificazione generale e controllo tensione cinghie',
      'Controllo e pulizia filtri aria',
      'Verifica allineamento e tensione catene',
      'Controllo livelli oli e liquidi',
      'Ispezione generale componenti meccanici',
      'Pulizia e lubrificazione guide lineari',
      'Controllo pressioni idrauliche/pneumatiche',
    ],
    straordinaria: [
      'Revisione completa gruppo trasmissione',
      'Sostituzione cuscinetti principali',
      'Taratura e calibrazione sensori',
      'Aggiornamento firmware centralina',
      'Sostituzione kit guarnizioni idrauliche',
      'Revisione sistema elettrico',
    ],
    guasto: [
      'Riparazione rottura cinghia trasmissione',
      'Sostituzione fusibile bruciato',
      'Riparazione perdita olio',
      'Sostituzione motore elettrico danneggiato',
      'Riparazione encoder posizione',
      'Sostituzione elettrovalvola difettosa',
    ],
    riparazione: [
      'Riparazione quadro elettrico',
      'Saldatura supporto incrinato',
      'Riparazione collegamento pneumatico',
      'Ripristino protezioni di sicurezza',
      'Riparazione pannello di controllo',
    ],
  };

  let maintenanceCount = 0;
  const technicians = [tecnico1, tecnico2];

  // Create maintenances for each machine over the last 12 months
  for (const machine of machines) {
    // Number of maintenances based on machine age (older = more maintenances)
    const machineAge = 2024 - machine.yearBuilt;
    const baseMaintenances = Math.max(3, Math.min(15, 5 + machineAge * 2));
    const numMaintenances = Math.floor(baseMaintenances + Math.random() * 5);

    for (let i = 0; i < numMaintenances; i++) {
      const type = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];
      const descriptions = workDescriptions[type];
      const workPerformed = descriptions[Math.floor(Math.random() * descriptions.length)];
      const technicianIndex = Math.floor(Math.random() * technicians.length);

      // Generate dates spread over last 12 months
      const monthOffset = Math.floor((i / numMaintenances) * 12);
      const maintenanceDate = randomDate(monthsAgo(monthOffset + 1), monthsAgo(monthOffset));

      await prisma.maintenance.create({
        data: {
          machineId: machine.id,
          operatorId: technicians[technicianIndex].id,
          date: maintenanceDate,
          type: type,
          workPerformed: workPerformed,
          spareParts: type !== 'ordinaria' ? 'Ricambi vari utilizzati' : null,
          cost: type === 'ordinaria' ? null : Math.floor(Math.random() * 500) + 50,
        },
      });
      maintenanceCount++;
    }
  }

  console.log(`✅ Maintenances created: ${maintenanceCount}`);

  // ==================== SCHEDULED MAINTENANCES ====================
  console.log('\n📅 Creating scheduled maintenances...');

  let scheduledCount = 0;
  const now = new Date();

  // Create scheduled maintenances for random machines
  const machinesForScheduled = machines.sort(() => 0.5 - Math.random()).slice(0, Math.floor(machines.length * 0.6));

  for (const machine of machinesForScheduled) {
    // Some machines have monthly, some quarterly
    const isMonthly = Math.random() > 0.5;

    const nextDue = new Date(now);
    nextDue.setDate(nextDue.getDate() + Math.floor(Math.random() * 60)); // Next 0-60 days

    await prisma.scheduledMaintenance.create({
      data: {
        machineId: machine.id,
        createdById: admin.id,
        title: isMonthly ? 'Manutenzione Ordinaria Mensile' : 'Manutenzione Trimestrale',
        description: 'Controllo generale, lubrificazione e verifica parametri funzionamento',
        frequency: isMonthly ? 'monthly' : 'quarterly',
        nextDueDate: nextDue,
        notificationDaysBefore: 7,
        isActive: true,
      },
    });
    scheduledCount++;
  }

  console.log(`✅ Scheduled maintenances created: ${scheduledCount}`);

  // ==================== DOCUMENTS ====================
  console.log('\n📄 Creating sample documents metadata...');

  const documentCategories = [
    'manuale_uso',
    'certificazione_ce',
    'scheda_tecnica',
    'fattura_acquisto',
    'altro',
  ] as const;

  let documentCount = 0;

  // Create documents for random machines
  for (const machine of machines) {
    const numDocs = Math.floor(Math.random() * 4) + 1; // 1-4 documents per machine

    for (let i = 0; i < numDocs; i++) {
      const category = documentCategories[Math.floor(Math.random() * documentCategories.length)];
      const uploadDate = randomDate(machine.purchaseDate, now);

      const fileNames: Record<string, string[]> = {
        manuale_uso: ['Manuale_Utente.pdf', 'Manual_Operatore.pdf', 'Istruzioni_Uso.pdf'],
        certificazione_ce: ['Certificato_CE.pdf', 'Dichiarazione_Conformita.pdf'],
        scheda_tecnica: ['Scheda_Tecnica.pdf', 'Specifiche_Tecniche.pdf', 'Datasheet.pdf'],
        fattura_acquisto: ['Fattura_Acquisto.pdf', 'DDT.pdf'],
        altro: ['Garanzia.pdf', 'Contratto_Manutenzione.pdf', 'Piano_Installazione.pdf'],
      };

      const possibleNames = fileNames[category];
      const fileName = possibleNames[Math.floor(Math.random() * possibleNames.length)];

      await prisma.document.create({
        data: {
          machineId: machine.id,
          uploadedById: admin.id,
          fileName: `${machine.serialNumber}_${fileName}`,
          filePath: `documents/${machine.id}/${fileName}`,
          mimeType: 'application/pdf',
          fileSize: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
          documentCategory: category,
          uploadedAt: uploadDate,
        },
      });
      documentCount++;
    }
  }

  console.log(`✅ Documents created: ${documentCount}`);

  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   • Users: 4`);
  console.log(`   • Categories: 5`);
  console.log(`   • Machine Types: ${createdTypes.length}`);
  console.log(`   • Machines: ${machines.length}`);
  console.log(`   • Maintenances: ${maintenanceCount}`);
  console.log(`   • Scheduled Maintenances: ${scheduledCount}`);
  console.log(`   • Documents: ${documentCount}`);
  console.log('='.repeat(50));

  console.log('\n📝 Login credentials:');
  console.log('  👨‍💼 Admin:      admin@coremachine.com / admin123');
  console.log('  🔧 Tecnico 1:  mario.rossi@coremachine.com / tecnico123');
  console.log('  🔧 Tecnico 2:  luca.bianchi@coremachine.com / tecnico123');
  console.log('  👤 Utente:     anna.ferrari@coremachine.com / utente123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
