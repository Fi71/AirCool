import { Router } from 'express';
import prisma from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { order: { select: { id: true, customerName: true } } }
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { orderId, amount, method, date, note } = req.body;
    if (!amount) return res.status(400).json({ error: 'Jumlah pembayaran wajib diisi.' });
    const payment = await prisma.payment.create({
      data: {
        orderId: orderId ? parseInt(orderId) : null,
        amount: parseFloat(amount),
        method: method || 'cash',
        date: date || new Date().toISOString().split('T')[0],
        note: note || ''
      }
    });
    if (orderId) {
      const allPayments = await prisma.payment.findMany({ where: { orderId: parseInt(orderId) } });
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
      await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: { paidAmount: totalPaid, paymentMethod: method || 'cash', paymentDate: date || new Date().toISOString().split('T')[0] }
      });
    }
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
