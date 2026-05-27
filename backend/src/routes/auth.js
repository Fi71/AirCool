import { Router } from 'express';
import prisma from '../config/supabase.js';
import { comparePassword, hashPassword, generateToken } from '../config/auth.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }
    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, username: user.username, role: user.role, phone: user.phone, telegramId: user.telegramId }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register', async (req, res) => {
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
      data: { name, username, password: hashed, role: role || 'technician', phone: phone || '', telegramId: telegramId || '' }
    });
    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, username: user.username, role: user.role, phone: user.phone, telegramId: user.telegramId }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, username: true, role: true, phone: true, telegramId: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
