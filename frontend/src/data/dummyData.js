// Dummy Data for AirCool Management System

export const dummyUsers = [
  { id: 1, name: 'Admin Utama', username: 'admin', password: 'admin123', role: 'admin', phone: '08123456789', telegramId: '@admin' },
  { id: 2, name: 'Ahmad Teknisi', username: 'ahmad', password: 'technician123', role: 'technician', phone: '08198765432', telegramId: '@ahmad_tek' },
  { id: 3, name: 'Budi Teknisi', username: 'budi', password: 'technician123', role: 'technician', phone: '08176543219', telegramId: '@budi_tek' },
  { id: 4, name: 'Manajer Utama', username: 'manajemen', password: 'manajemen123', role: 'management', phone: '08155555555', telegramId: '@manajer' },
];

export const dummyProducts = [
  { id: 1, code: 'FRE-001', name: 'Freon R32', category: 'sparepart', price: 250000, purchasePrice: 200000, stock: 15, minStock: 5 },
  { id: 2, code: 'FLT-002', name: 'Filter AC Inverter', category: 'sparepart', price: 150000, purchasePrice: 120000, stock: 8, minStock: 3 },
  { id: 3, code: 'FLT-003', name: 'Filter AC Split', category: 'sparepart', price: 75000, purchasePrice: 60000, stock: 20, minStock: 5 },
  { id: 4, code: 'RCM-004', name: 'Remote Controller', category: 'sparepart', price: 180000, purchasePrice: 150000, stock: 12, minStock: 4 },
  { id: 5, code: 'AC-001', name: 'Unit AC 1/2 PK Inverter', category: 'unit', price: 3500000, purchasePrice: 3000000, stock: 5, minStock: 2 },
  { id: 6, code: 'AC-002', name: 'Unit AC 1 PK Split', category: 'unit', price: 4500000, purchasePrice: 4000000, stock: 8, minStock: 3 },
  { id: 7, code: 'PTT-005', name: 'Protective Cover', category: 'accessories', price: 75000, purchasePrice: 60000, stock: 25, minStock: 10 },
];

export const dummyServices = [
  { id: 1, name: 'Cuci AC', price: 75000 },
  { id: 2, name: 'Isi Freon R32', price: 200000 },
  { id: 3, name: 'Bongkar-Pasang', price: 100000 },
  { id: 4, name: 'Cek Kerusakan & Perbaikan', price: 125000 },
];

export const dummyCustomers = [
  { id: 1, name: 'Budi Santoso', address: 'Jl. Mawar No. 123, Jakarta Selatan', phone: '081234567890', joinDate: '2025-01-15' },
  { id: 2, name: 'Siti Aminah', address: 'Jl. Melati No. 45, Jakarta Pusat', phone: '081987654321', joinDate: '2025-02-20' },
  { id: 3, name: 'Ahmad Rizky', address: 'Jl. Kenanga No. 78, Depok', phone: '081765432109', joinDate: '2025-03-10' },
];

export const dummyOrders = [
  { id: 1, customerId: 1, customerName: 'Budi Santoso', address: 'Jl. Mawar No. 123, Jakarta Selatan', phone: '081234567890', type: 'service', status: 'DONE', createdAt: '2026-05-15', scheduledDate: '2026-05-16', technicianIds: [1], notes: 'AC mati total, butuh isi freon', items: [
    { serviceId: 2, name: 'Isi Freon R32', qty: 2, price: 200000 },
    { serviceId: 4, name: 'Cek Kerusakan & Perbaikan', qty: 1, price: 125000 },
  ], totalCost: 525000, paidAmount: 525000, paymentMethod: 'transfer', paymentDate: '2026-05-16', report: { description: 'Freon habis, compressor baik, ganti filter', sparesUsed: [{ productId: 1, name: 'Freon R32', qty: 2, price: 200000 }] }, serviceHistory: [] },
  { id: 2, customerId: 2, customerName: 'Siti Aminah', address: 'Jl. Melati No. 45, Jakarta Pusat', phone: '081987654321', type: 'service', status: 'PROCESS', createdAt: '2026-05-18', scheduledDate: '2026-05-19', technicianIds: [2], notes: 'AC dingin tidak kencang, membutuhkan servis rutin', items: [
    { serviceId: 1, name: 'Cuci AC', qty: 1, price: 75000 },
  ], totalCost: 75000, paidAmount: 0, paymentMethod: '', paymentDate: '', report: { description: '', sparesUsed: [] }, serviceHistory: [] },
  { id: 3, customerId: 3, customerName: 'Ahmad Rizky', address: 'Jl. Kenanga No. 78, Depok', phone: '081765432109', type: 'sales', status: 'DONE', createdAt: '2026-05-19', scheduledDate: '2026-05-20', technicianIds: [], notes: 'Pembelian unit AC 1 PK Split', items: [
    { productId: 6, name: 'Unit AC 1 PK Split', qty: 1, price: 4500000 },
  ], totalCost: 4500000, paidAmount: 4500000, paymentMethod: 'transfer', paymentDate: '2026-05-20', report: { description: '', sparesUsed: [] }, serviceHistory: [] },
  { id: 4, customerId: 1, customerName: 'Budi Santoso', address: 'Jl. Mawar No. 123, Jakarta Selatan', phone: '081234567890', type: 'service', status: 'ORDER', createdAt: '2026-05-20', scheduledDate: '2026-05-22', technicianIds: [1], notes: 'AC dibasu', items: [
    { serviceId: 1, name: 'Cuci AC', qty: 1, price: 75000 },
  ], totalCost: 75000, paidAmount: 0, paymentMethod: '', paymentDate: '', report: { description: '', sparesUsed: [] }, serviceHistory: [{ status: 'ORDER', date: '2026-05-20', technician: 'Ahmad Teknisi', note: 'Order dibuat' }] },
];

export const dummyPayments = [
  { id: 1, orderId: 1, amount: 525000, method: 'transfer', date: '2026-05-16', note: 'Pembayaran via transfer bank' },
  { id: 2, orderId: 3, amount: 4500000, method: 'transfer', date: '2026-05-20', note: 'Pembayaran via transfer bank' },
];

export const dummyInventory = [
  { id: 1, productId: 1, product: dummyProducts[0], type: 'IN', quantity: 15, reference: 'PO-2026-001', date: '2026-05-10', supplier: 'PT Cool Supply' },
  { id: 2, productId: 2, product: dummyProducts[1], type: 'IN', quantity: 8, reference: 'PO-2026-002', date: '2026-05-12', supplier: 'PT Cool Supply' },
  { id: 3, productId: 2, product: dummyProducts[1], type: 'OUT', quantity: 1, reference: 'ORDER-001', date: '2026-05-16', supplier: '' },
];

export const dummyMaintenance = [
  { id: 1, customerId: 1, customerName: 'Budi Santoso', address: 'Jl. Mawar No. 123, Jakarta Selatan', phone: '081234567890', unit: 'AC Split 1 PK', interval: 3, startDate: '2025-05-01', lastService: '2026-05-16', nextService: '2026-08-01', isActive: true },
  { id: 2, customerId: 2, customerName: 'Siti Aminah', address: 'Jl. Melati No. 45, Jakarta Pusat', phone: '081987654321', unit: 'AC Inverter 1/2 PK', interval: 3, startDate: '2025-02-01', lastService: '2026-05-19', nextService: '2026-08-19', isActive: true },
];

export const dummyNotifications = [
  { id: 1, userId: 1, type: 'daily', message: 'Daftar order yang jatuh tempo: Order #2, #4', sentAt: '2026-05-20 07:00', status: 'sent', channels: ['wa', 'telegram'] },
  { id: 2, userId: 2, type: 'daily', message: 'Tugas service hari ini: Order #2 (19 Mei)', sentAt: '2026-05-20 07:00', status: 'sent', channels: ['wa', 'telegram'] },
];