import { Router } from 'express';
import prisma from '../config/supabase.js';
import { hashPassword } from '../config/auth.js';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleCheck.js';

const router = Router();

router.use(authenticate, allowRoles('admin'));

router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, username: true, role: true, phone: true, telegramId: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, username, password, role, phone, telegramId } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Nama, username, dan password wajib diisi.' });
    }
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: 'Username sudah digunakan.' });
    }
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, username, password: hashed, role: role || 'technician', phone: phone || '', telegramId: telegramId || '' },
      select: { id: true, name: true, username: true, role: true, phone: true, telegramId: true }
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { role, phone, telegramId } = req.body;
    const data = {};
    if (role !== undefined) data.role = role;
    if (phone !== undefined) data.phone = phone;
    if (telegramId !== undefined) data.telegramId = telegramId;

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data,
      select: { id: true, name: true, username: true, role: true, phone: true, telegramId: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password baru wajib diisi.' });
    }
    const hashed = await hashPassword(password);
    await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { password: hashed }
    });
    res.json({ message: 'Password berhasil direset.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Tidak dapat menghapus akun sendiri.' });
    }
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
