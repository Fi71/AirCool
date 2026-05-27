import { Router } from 'express';
import prisma from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [
      ordersThisMonth,
      doneOrders,
      revenueResult,
      totalPurchases,
      lowStockProducts,
      activeOrders,
      todayOrders,
      maintenanceDue
    ] = await Promise.all([
      prisma.order.findMany({ where: { createdAt: { gte: new Date(monthStart) } } }),
      prisma.order.findMany({ where: { status: 'DONE' } }),
      prisma.order.aggregate({ where: { status: 'DONE' }, _sum: { paidAmount: true } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.product.findMany({ where: { stock: { lte: prisma.product.fields.minStock } } }),
      prisma.order.findMany({ where: { status: { in: ['ORDER', 'PROCESS', 'PENDING', 'OUTSTANDING'] } }, include: { technicians: { include: { technician: { select: { id: true, name: true } } } }, customer: true }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.order.findMany({ where: { scheduledDate: today }, include: { technicians: { include: { technician: { select: { id: true, name: true } } } } } }),
      prisma.maintenanceContract.findMany({ where: { isActive: true, nextService: { lte: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0] } }, orderBy: { nextService: 'asc' }, take: 10 })
    ]);

    res.json({
      totalOrdersThisMonth: ordersThisMonth.length,
      totalOrdersDone: doneOrders.length,
      revenue: revenueResult._sum.paidAmount || 0,
      totalPurchases: totalPurchases._sum.amount || 0,
      lowStockProducts,
      activeOrders,
      todayOrders,
      maintenanceDue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
