import { Router } from 'express';
import prisma from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleCheck.js';

const router = Router();

router.use(authenticate, allowRoles('admin'));

router.post('/clear-transactions', async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.serviceHistory.deleteMany(),
      prisma.orderSparepart.deleteMany(),
      prisma.orderServiceItem.deleteMany(),
      prisma.orderItem.deleteMany(),
      prisma.orderTechnician.deleteMany(),
      prisma.orderReport.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.inventoryEntry.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.maintenanceContract.deleteMany(),
      prisma.order.deleteMany(),
    ]);
    res.json({ message: 'Semua data transaksi berhasil dikosongkan.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/clear-master', async (req, res) => {
  try {
    const adminId = req.user.id;
    await prisma.$transaction([
      prisma.serviceHistory.deleteMany(),
      prisma.orderSparepart.deleteMany(),
      prisma.orderServiceItem.deleteMany(),
      prisma.orderItem.deleteMany(),
      prisma.orderTechnician.deleteMany(),
      prisma.orderReport.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.inventoryEntry.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.maintenanceContract.deleteMany(),
      prisma.order.deleteMany(),
      prisma.product.deleteMany(),
      prisma.service.deleteMany(),
      prisma.customer.deleteMany(),
      prisma.user.deleteMany({ where: { id: { not: adminId } } }),
    ]);
    res.json({ message: 'Semua data master dan transaksi berhasil dikosongkan (admin saat ini tetap ada).' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
