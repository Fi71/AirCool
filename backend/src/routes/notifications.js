import { Router } from 'express';
import prisma from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const where = {};
    if (req.user.role !== 'admin') {
      where.userId = req.user.id;
    }
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: 50
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, type, message, channels } = req.body;
    const notification = await prisma.notification.create({
      data: {
        userId: userId ? parseInt(userId) : null,
        type: type || 'daily',
        message: message || '',
        channels: channels ? JSON.stringify(channels) : '["wa","telegram"]',
        status: 'sent'
      }
    });
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
