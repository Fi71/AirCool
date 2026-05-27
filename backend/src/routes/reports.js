import { Router } from 'express';
import prisma from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/financial', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59.999Z') };
    }
    const doneOrders = await prisma.order.findMany({
      where: { status: 'DONE', ...dateFilter },
      include: { payments: true }
    });
    const totalRevenue = doneOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
    const serviceRevenue = doneOrders.filter(o => o.type === 'service').reduce((sum, o) => sum + (o.paidAmount || 0), 0);
    const salesRevenue = doneOrders.filter(o => o.type === 'sales').reduce((sum, o) => sum + (o.paidAmount || 0), 0);
    const purchases = await prisma.inventoryEntry.findMany({
      where: { type: 'IN', ...dateFilter }
    });
    const totalExpenses = purchases.reduce((sum, e) => sum + (e.quantity * (e.product?.purchasePrice || 0)), 0);
    res.json({
      totalRevenue,
      serviceRevenue,
      salesRevenue,
      totalExpenses,
      grossProfit: totalRevenue - totalExpenses,
      totalOrders: doneOrders.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/completed-orders', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { status: 'DONE' };
    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59.999Z') };
    }
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        technicians: { include: { technician: { select: { id: true, name: true } } } },
        items: true,
        serviceItems: true,
        spareparts: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/technician-performance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const technicians = await prisma.user.findMany({ where: { role: 'technician' } });
    const result = await Promise.all(technicians.map(async (tech) => {
      const where = {
        technicians: { some: { technicianId: tech.id } },
        status: 'DONE'
      };
      if (startDate && endDate) {
        where.createdAt = { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59.999Z') };
      }
      const orders = await prisma.order.findMany({ where });
      const totalRevenue = orders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
      return {
        id: tech.id,
        name: tech.name,
        totalOrders: orders.length,
        totalRevenue,
        rating: 0
      };
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stock-movement', async (req, res) => {
  try {
    const { startDate, endDate, productId } = req.query;
    const where = {};
    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59.999Z') };
    }
    if (productId) where.productId = parseInt(productId);
    const entries = await prisma.inventoryEntry.findMany({
      where,
      include: { product: { select: { id: true, code: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
