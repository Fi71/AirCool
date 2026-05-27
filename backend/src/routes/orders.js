import { Router } from 'express';
import prisma from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { status, type, customerId, technicianId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (customerId) where.customerId = parseInt(customerId);
    if (technicianId) {
      where.technicians = { some: { technicianId: parseInt(technicianId) } };
    }
    if (req.user.role === 'technician') {
      where.technicians = { some: { technicianId: req.user.id } };
    }
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        technicians: { include: { technician: { select: { id: true, name: true } } } },
        items: true,
        serviceItems: true,
        spareparts: true,
        payments: true,
        serviceHistory: { orderBy: { createdAt: 'asc' } },
        report: true
      }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        technicians: { include: { technician: { select: { id: true, name: true } } } },
        items: true,
        serviceItems: true,
        spareparts: true,
        payments: true,
        serviceHistory: { orderBy: { createdAt: 'asc' } },
        report: true
      }
    });
    if (!order) return res.status(404).json({ error: 'Order tidak ditemukan.' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { customerId, customerName, address, phone, type, status, notes, scheduledDate, technicianIds, items, serviceItems, totalCost, paidAmount, paymentMethod, paymentDate, report, serviceHistory } = req.body;
    const order = await prisma.order.create({
      data: {
        customerId: customerId ? parseInt(customerId) : null,
        customerName: customerName || '',
        address: address || '',
        phone: phone || '',
        type: type || 'service',
        status: status || 'ORDER',
        notes: notes || '',
        scheduledDate: scheduledDate || '',
        technicianIds: technicianIds || [],
        totalCost: parseFloat(totalCost) || 0,
        paidAmount: parseFloat(paidAmount) || 0,
        paymentMethod: paymentMethod || '',
        paymentDate: paymentDate || '',
        items: items ? { create: items.map(i => ({ productId: i.productId ? parseInt(i.productId) : null, name: i.name, qty: parseInt(i.qty) || 1, price: parseFloat(i.price) || 0 })) } : undefined,
        serviceItems: serviceItems ? { create: serviceItems.map(s => ({ serviceId: s.serviceId ? parseInt(s.serviceId) : null, name: s.name, qty: parseInt(s.qty) || 1, price: parseFloat(s.price) || 0 })) } : undefined,
        technicians: technicianIds ? {
          create: technicianIds.map(id => ({ technicianId: parseInt(id) }))
        } : undefined,
        serviceHistory: {
          create: (serviceHistory && serviceHistory.length > 0 ? serviceHistory : [{ status: status || 'ORDER', date: new Date().toISOString().split('T')[0], technician: req.user.name, note: 'Order dibuat' }]).map(h => ({ status: h.status || 'ORDER', date: h.date || new Date().toISOString().split('T')[0], technician: h.technician || req.user.name, note: h.note || 'Order dibuat' }))
        },
        report: report ? {
          create: { description: report.description || '', photos: Array.isArray(report.photos) ? JSON.stringify(report.photos) : (report.photos || '[]'), rating: report.rating || null, feedback: report.feedback || '' }
        } : undefined
      },
      include: {
        technicians: { include: { technician: { select: { id: true, name: true } } } },
        items: true,
        serviceItems: true,
        serviceHistory: true,
        report: true
      }
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { customerId, customerName, address, phone, type, status, notes, scheduledDate, technicianIds, items, serviceItems, spareparts, totalCost, paidAmount, paymentMethod, paymentDate, report } = req.body;
    const data = {};
    if (customerId !== undefined) data.customerId = customerId ? parseInt(customerId) : null;
    if (customerName !== undefined) data.customerName = customerName;
    if (address !== undefined) data.address = address;
    if (phone !== undefined) data.phone = phone;
    if (type !== undefined) data.type = type;
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (scheduledDate !== undefined) data.scheduledDate = scheduledDate;
    if (technicianIds !== undefined) data.technicianIds = technicianIds;
    if (totalCost !== undefined) data.totalCost = parseFloat(totalCost);
    if (paidAmount !== undefined) data.paidAmount = parseFloat(paidAmount);
    if (paymentMethod !== undefined) data.paymentMethod = paymentMethod;
    if (paymentDate !== undefined) data.paymentDate = paymentDate;

    if (status) {
      await prisma.serviceHistory.create({
        data: { orderId: id, status, date: new Date().toISOString().split('T')[0], technician: req.user.name, note: `Status diubah ke ${status}` }
      });
    }

    if (items) {
      await prisma.orderItem.deleteMany({ where: { orderId: id } });
      await prisma.orderItem.createMany({ data: items.map(i => ({ orderId: id, productId: i.productId ? parseInt(i.productId) : null, name: i.name, qty: parseInt(i.qty) || 1, price: parseFloat(i.price) || 0 })) });
    }
    if (serviceItems) {
      await prisma.orderServiceItem.deleteMany({ where: { orderId: id } });
      await prisma.orderServiceItem.createMany({ data: serviceItems.map(s => ({ orderId: id, serviceId: s.serviceId ? parseInt(s.serviceId) : null, name: s.name, qty: parseInt(s.qty) || 1, price: parseFloat(s.price) || 0 })) });
    }
    if (spareparts) {
      await prisma.orderSparepart.deleteMany({ where: { orderId: id } });
      await prisma.orderSparepart.createMany({ data: spareparts.map(s => ({ orderId: id, productId: s.productId ? parseInt(s.productId) : null, name: s.name, qty: parseInt(s.qty) || 1, price: parseFloat(s.price) || 0 })) });
    }
    if (technicianIds) {
      await prisma.orderTechnician.deleteMany({ where: { orderId: id } });
      await prisma.orderTechnician.createMany({ data: technicianIds.map(tid => ({ orderId: id, technicianId: parseInt(tid) })) });
    }
    if (report) {
      const photosStr = Array.isArray(report.photos) ? JSON.stringify(report.photos) : (report.photos || '[]');
      await prisma.orderReport.upsert({
        where: { orderId: id },
        create: { orderId: id, description: report.description || '', photos: photosStr, rating: report.rating || null, feedback: report.feedback || '' },
        update: { description: report.description || '', photos: photosStr, rating: report.rating || null, feedback: report.feedback || '' }
      });
    }

    const order = await prisma.order.update({
      where: { id },
      data,
      include: {
        technicians: { include: { technician: { select: { id: true, name: true } } } },
        items: true,
        serviceItems: true,
        spareparts: true,
        payments: true,
        serviceHistory: { orderBy: { createdAt: 'asc' } },
        report: true
      }
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, note } = req.body;
    await prisma.serviceHistory.create({
      data: { orderId: id, status: status || 'ORDER', date: new Date().toISOString().split('T')[0], technician: req.user.name, note: note || `Status diubah ke ${status}` }
    });
    const order = await prisma.order.update({
      where: { id },
      data: { status: status || 'ORDER' },
      include: { serviceHistory: { orderBy: { createdAt: 'asc' } } }
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.order.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Order berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
