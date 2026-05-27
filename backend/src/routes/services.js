import { Router } from 'express';
import prisma from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const services = await prisma.service.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama jasa wajib diisi.' });
    const service = await prisma.service.create({
      data: { name, price: parseFloat(price) || 0 }
    });
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, price } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (price !== undefined) data.price = parseFloat(price);
    const service = await prisma.service.update({ where: { id }, data });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.service.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Jasa berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
