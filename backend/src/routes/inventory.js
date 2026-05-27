import { Router } from 'express';
import prisma from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const entries = await prisma.inventoryEntry.findMany({
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { id: true, code: true, name: true, purchasePrice: true } } }
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { productId, type, quantity, reference, date, supplier, note } = req.body;
    if (!productId || !type || !quantity) {
      return res.status(400).json({ error: 'Produk, tipe, dan jumlah wajib diisi.' });
    }
    const qty = parseInt(quantity);
    const entry = await prisma.inventoryEntry.create({
      data: {
        productId: parseInt(productId),
        type,
        quantity: qty,
        reference: reference || '',
        date: date || new Date().toISOString().split('T')[0],
        supplier: supplier || '',
        note: note || ''
      }
    });
    const product = await prisma.product.findUnique({ where: { id: parseInt(productId) } });
    if (product) {
      const newStock = type === 'IN' ? product.stock + qty : Math.max(0, product.stock - qty);
      await prisma.product.update({
        where: { id: parseInt(productId) },
        data: { stock: newStock }
      });
    }
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
