import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@coremachine.com' },
    update: {},
    create: {
      email: 'admin@coremachine.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'CoreMachine',
      role: UserRole.admin,
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create tecnico user
  const tecnicoPassword = await bcrypt.hash('tecnico123', 10);

  const tecnico = await prisma.user.upsert({
    where: { email: 'tecnico@coremachine.com' },
    update: {},
    create: {
      email: 'tecnico@coremachine.com',
      password: tecnicoPassword,
      firstName: 'Mario',
      lastName: 'Rossi',
      role: UserRole.tecnico,
      isActive: true,
    },
  });

  console.log('✅ Tecnico user created:', tecnico.email);

  // Create sample categories
  const cucitrici = await prisma.category.upsert({
    where: { name: 'CUCITRICI' },
    update: {},
    create: {
      name: 'CUCITRICI',
      description: 'Macchine cucitrici per assemblaggio',
    },
  });

  const presse = await prisma.category.upsert({
    where: { name: 'PRESSE' },
    update: {},
    create: {
      name: 'PRESSE',
      description: 'Presse industriali',
    },
  });

  console.log('✅ Categories created');

  // Create sample types
  const lineareType = await prisma.type.upsert({
    where: {
      categoryId_name: {
        categoryId: cucitrici.id,
        name: 'LINEARE',
      },
    },
    update: {},
    create: {
      categoryId: cucitrici.id,
      name: 'LINEARE',
      description: 'Cucitrici lineari',
    },
  });

  const colonnaType = await prisma.type.upsert({
    where: {
      categoryId_name: {
        categoryId: presse.id,
        name: 'A COLONNA',
      },
    },
    update: {},
    create: {
      categoryId: presse.id,
      name: 'A COLONNA',
      description: 'Presse a colonna',
    },
  });

  console.log('✅ Types created');

  // Create sample machines
  const machine1 = await prisma.machine.upsert({
    where: { serialNumber: 'CUC-001' },
    update: {},
    create: {
      typeId: lineareType.id,
      serialNumber: 'CUC-001',
      description: 'Cucitrice Lineare Principale',
      manufacturer: 'ACME Industries',
      model: 'ACM-500X',
      yearBuilt: 2020,
      purchaseDate: new Date('2020-06-15'),
      dealer: 'Fornitore Macchinari SRL',
      invoiceReference: 'FT2020/0456',
    },
  });

  const machine2 = await prisma.machine.upsert({
    where: { serialNumber: 'PRE-001' },
    update: {},
    create: {
      typeId: colonnaType.id,
      serialNumber: 'PRE-001',
      description: 'Pressa Idraulica 50T',
      manufacturer: 'Hydraulics Co.',
      model: 'HYD-50T',
      yearBuilt: 2019,
      purchaseDate: new Date('2019-03-20'),
      dealer: 'Macchinari Industriali SpA',
      invoiceReference: 'FT2019/0123',
    },
  });

  console.log('✅ Sample machines created');

  // Create sample maintenance
  await prisma.maintenance.create({
    data: {
      machineId: machine1.id,
      operatorId: tecnico.id,
      date: new Date(),
      type: 'ordinaria',
      workPerformed: 'Lubrificazione generale e controllo tensione cinghie',
      spareParts: 'Olio lubrificante (2L)',
      cost: 45.0,
    },
  });

  console.log('✅ Sample maintenance created');

  // Create scheduled maintenance
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await prisma.scheduledMaintenance.create({
    data: {
      machineId: machine1.id,
      createdById: admin.id,
      title: 'Manutenzione Mensile Programmata',
      description: 'Controllo generale e lubrificazione',
      frequency: 'monthly',
      nextDueDate: nextMonth,
      notificationDaysBefore: 7,
      isActive: true,
    },
  });

  console.log('✅ Scheduled maintenance created');

  console.log('\n🎉 Seeding completed!\n');
  console.log('📝 Login credentials:');
  console.log('  Admin:   admin@coremachine.com / admin123');
  console.log('  Tecnico: tecnico@coremachine.com / tecnico123\n');
}

main()
  .catch(e => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
