import { Router } from 'express';
import prisma from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { joinDate: 'desc' },
      include: { _count: { select: { orders: true, maintenanceContracts: true } } }
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        orders: { orderBy: { createdAt: 'desc' }, take: 20 },
        maintenanceContracts: { where: { isActive: true } }
      }
    });
    if (!customer) return res.status(404).json({ error: 'Customer tidak ditemukan.' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nama customer wajib diisi.' });
    }
    const existing = await prisma.customer.findFirst({ where: { name, phone: phone || '' } });
    if (existing) {
      return res.status(400).json({ error: 'Customer dengan nama dan nomor telepon yang sama sudah ada.' });
    }
    const customer = await prisma.customer.create({
      data: { name, address: address || '', phone: phone || '' }
    });
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, address, phone } = req.body;
    const existing = await prisma.customer.findFirst({
      where: { name, phone: phone || '', id: { not: id } }
    });
    if (existing) {
      return res.status(400).json({ error: 'Customer dengan nama dan nomor telepon yang sama sudah ada.' });
    }
    const data = {};
    if (name !== undefined) data.name = name;
    if (address !== undefined) data.address = address;
    if (phone !== undefined) data.phone = phone;
    const customer = await prisma.customer.update({ where: { id }, data });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Customer berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
