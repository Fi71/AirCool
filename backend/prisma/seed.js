import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hash = await bcrypt.hash('admin123', 10);
  const techHash = await bcrypt.hash('technician123', 10);
  const mgmtHash = await bcrypt.hash('manajemen123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { name: 'Admin Utama', username: 'admin', password: hash, role: 'admin', phone: '08123456789', telegramId: '@admin' }
  });

  await prisma.user.upsert({
    where: { username: 'ahmad' },
    update: {},
    create: { name: 'Ahmad Teknisi', username: 'ahmad', password: techHash, role: 'technician', phone: '08198765432', telegramId: '@ahmad_tek' }
  });

  await prisma.user.upsert({
    where: { username: 'budi' },
    update: {},
    create: { name: 'Budi Teknisi', username: 'budi', password: techHash, role: 'technician', phone: '08176543219', telegramId: '@budi_tek' }
  });

  await prisma.user.upsert({
    where: { username: 'manajemen' },
    update: {},
    create: { name: 'Manajer Utama', username: 'manajemen', password: mgmtHash, role: 'management', phone: '08155555555', telegramId: '@manajer' }
  });

  // Categories
  const catUnit = await prisma.category.upsert({ where: { name: 'Unit AC' }, update: {}, create: { name: 'Unit AC' } });
  const catSparepart = await prisma.category.upsert({ where: { name: 'Sparepart' }, update: {}, create: { name: 'Sparepart' } });
  const catAccessories = await prisma.category.upsert({ where: { name: 'Aksesoris' }, update: {}, create: { name: 'Aksesoris' } });

  // Products
  const products = [
    { code: 'FRE-001', name: 'Freon R32', categoryId: catSparepart.id, price: 250000, purchasePrice: 200000, stock: 15, minStock: 5 },
    { code: 'FLT-002', name: 'Filter AC Inverter', categoryId: catSparepart.id, price: 150000, purchasePrice: 120000, stock: 8, minStock: 3 },
    { code: 'FLT-003', name: 'Filter AC Split', categoryId: catSparepart.id, price: 75000, purchasePrice: 60000, stock: 20, minStock: 5 },
    { code: 'RCM-004', name: 'Remote Controller', categoryId: catSparepart.id, price: 180000, purchasePrice: 150000, stock: 12, minStock: 4 },
    { code: 'AC-001', name: 'Unit AC 1/2 PK Inverter', categoryId: catUnit.id, price: 3500000, purchasePrice: 3000000, stock: 5, minStock: 2 },
    { code: 'AC-002', name: 'Unit AC 1 PK Split', categoryId: catUnit.id, price: 4500000, purchasePrice: 4000000, stock: 8, minStock: 3 },
    { code: 'PTT-005', name: 'Protective Cover', categoryId: catAccessories.id, price: 75000, purchasePrice: 60000, stock: 25, minStock: 10 },
  ];
  for (const p of products) {
    await prisma.product.upsert({ where: { code: p.code }, update: {}, create: p });
  }

  // Services
  const services = [
    { name: 'Cuci AC', price: 75000 },
    { name: 'Isi Freon R32', price: 200000 },
    { name: 'Bongkar-Pasang', price: 100000 },
    { name: 'Cek Kerusakan & Perbaikan', price: 125000 },
  ];
  for (const s of services) {
    await prisma.service.create({ data: s });
  }

  // Customers
  const customers = [
    { name: 'Budi Santoso', address: 'Jl. Mawar No. 123, Jakarta Selatan', phone: '081234567890' },
    { name: 'Siti Aminah', address: 'Jl. Melati No. 45, Jakarta Pusat', phone: '081987654321' },
    { name: 'Ahmad Rizky', address: 'Jl. Kenanga No. 78, Depok', phone: '081765432109' },
  ];
  for (const c of customers) {
    await prisma.customer.create({ data: c });
  }

  // Orders
  const [customer1, customer2, customer3] = await prisma.customer.findMany();
  const [freon, filter] = await prisma.product.findMany({ take: 2 });
  const [cuci, isiFreon, cek] = await prisma.service.findMany({ take: 3 });
  const [ahmad, budi] = await prisma.user.findMany({ where: { role: 'technician' } });

  const order1 = await prisma.order.create({
    data: {
      customerId: customer1.id, customerName: customer1.name, address: customer1.address, phone: customer1.phone,
      type: 'service', status: 'DONE', notes: 'AC mati total, butuh isi freon',
      scheduledDate: '2026-05-16', totalCost: 525000, paidAmount: 525000, paymentMethod: 'transfer', paymentDate: '2026-05-16',
      technicianIds: [ahmad.id],
      technicians: { create: [{ technicianId: ahmad.id }] },
      serviceItems: { create: [{ serviceId: isiFreon.id, name: isiFreon.name, qty: 2, price: isiFreon.price }, { serviceId: cek.id, name: cek.name, qty: 1, price: cek.price }] },
      spareparts: { create: [{ productId: freon.id, name: freon.name, qty: 2, price: freon.price }] },
      serviceHistory: { create: [{ status: 'ORDER', date: '2026-05-15', technician: 'Admin', note: 'Order dibuat' }, { status: 'PROCESS', date: '2026-05-16', technician: 'Ahmad Teknisi', note: 'Teknisi berangkat' }, { status: 'DONE', date: '2026-05-16', technician: 'Ahmad Teknisi', note: 'Service selesai, freon diisi' }] }
    }
  });

  await prisma.orderSparepart.updateMany({ where: { orderId: order1.id }, data: { price: freon.price } });

  const order2 = await prisma.order.create({
    data: {
      customerId: customer2.id, customerName: customer2.name, address: customer2.address, phone: customer2.phone,
      type: 'service', status: 'PROCESS', notes: 'AC dingin tidak kencang',
      scheduledDate: '2026-05-19', totalCost: 75000, paidAmount: 0, paymentMethod: '', paymentDate: '',
      technicianIds: [budi.id],
      technicians: { create: [{ technicianId: budi.id }] },
      serviceItems: { create: [{ serviceId: cuci.id, name: cuci.name, qty: 1, price: cuci.price }] },
      serviceHistory: { create: [{ status: 'ORDER', date: '2026-05-18', technician: 'Admin', note: 'Order dibuat' }, { status: 'PROCESS', date: '2026-05-19', technician: 'Budi Teknisi', note: 'Proses service' }] }
    }
  });

  await prisma.order.create({
    data: {
      customerId: customer3.id, customerName: customer3.name, address: customer3.address, phone: customer3.phone,
      type: 'sales', status: 'DONE', notes: 'Pembelian unit AC 1 PK Split',
      scheduledDate: '2026-05-20', totalCost: 4500000, paidAmount: 4500000, paymentMethod: 'transfer', paymentDate: '2026-05-20',
      items: { create: [{ productId: 6, name: 'Unit AC 1 PK Split', qty: 1, price: 4500000 }] },
      serviceHistory: { create: [{ status: 'ORDER', date: '2026-05-19', technician: 'Admin', note: 'Order dibuat' }, { status: 'DONE', date: '2026-05-20', technician: 'Admin', note: 'Pembayaran lunas' }] }
    }
  });

  // Maintenance contracts
  await prisma.maintenanceContract.create({
    data: {
      customerId: customer1.id, customerName: customer1.name, address: customer1.address, phone: customer1.phone,
      unit: 'AC Split 1 PK', interval: 3, startDate: '2025-05-01', lastService: '2026-05-16', nextService: '2026-08-01', isActive: true
    }
  });

  await prisma.maintenanceContract.create({
    data: {
      customerId: customer2.id, customerName: customer2.name, address: customer2.address, phone: customer2.phone,
      unit: 'AC Inverter 1/2 PK', interval: 3, startDate: '2025-02-01', lastService: '2026-05-19', nextService: '2026-08-19', isActive: true
    }
  });

  console.log('Database seeded successfully!');
  console.log('Admin: admin / admin123');
  console.log('Teknisi: ahmad / technician123');
  console.log('Teknisi: budi / technician123');
  console.log('Manajemen: manajemen / manajemen123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
