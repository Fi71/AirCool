import { Router } from 'express';
import prisma from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { checkAndNotify, sendOverdueNotifications } from '../services/maintenanceNotifier.js';
import { getNotificationConfig, updateNotificationConfig, getSchedulerStatus } from '../services/scheduler.js';

const router = Router();

// Public endpoints (no auth)
router.get('/scheduler-status', async (req, res) => {
  try {
    const status = getSchedulerStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/scheduler-config', async (req, res) => {
  try {
    const config = getNotificationConfig();
    res.json({
      success: true,
      whatsapp: { enabled: config.whatsapp?.enabled || false, phoneNumber: config.whatsapp?.phoneNumber ? '***' + config.whatsapp.phoneNumber.slice(-4) : '(kosong)' },
      telegram: { enabled: config.telegram?.enabled || false, hasChatId: !!config.telegram?.chatId }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const contracts = await prisma.maintenanceContract.findMany({
      orderBy: { nextService: 'asc' },
      include: { customer: true }
    });
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { customerId, customerName, address, phone, unit, productId, interval, startDate, lastService, nextService, isActive, notes } = req.body;
    if (!customerName) return res.status(400).json({ error: 'Nama customer wajib diisi.' });
    const contract = await prisma.maintenanceContract.create({
      data: {
        customerId: customerId ? parseInt(customerId) : null,
        customerName: customerName || '',
        address: address || '',
        phone: phone || '',
        unit: unit || '',
        productId: productId ? parseInt(productId) : null,
        interval: parseInt(interval) || 3,
        startDate: startDate || new Date().toISOString().split('T')[0],
        lastService: lastService || new Date().toISOString().split('T')[0],
        nextService: nextService || '',
        isActive: isActive !== undefined ? isActive : true,
        notes: notes || ''
      }
    });
    res.status(201).json(contract);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// notification-config must come BEFORE /:id wildcard to avoid route collision
// GET /notification-config — Get saved notification config
router.get('/notification-config', async (req, res) => {
  try {
    const config = getNotificationConfig();
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /notification-config — Save notification config
router.put('/notification-config', async (req, res) => {
  try {
    const { whatsapp, telegram } = req.body;
    const ok = updateNotificationConfig({ whatsapp, telegram });
    res.json({ success: ok, message: ok ? 'Config saved' : 'Failed to save' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { customerName, address, phone, unit, interval, nextService, isActive, notes } = req.body;
    const data = {};
    if (customerName !== undefined) data.customerName = customerName;
    if (address !== undefined) data.address = address;
    if (phone !== undefined) data.phone = phone;
    if (unit !== undefined) data.unit = unit;
    if (interval !== undefined) data.interval = parseInt(interval);
    if (nextService !== undefined) data.nextService = nextService;
    if (isActive !== undefined) data.isActive = isActive;
    if (notes !== undefined) data.notes = notes;
    const contract = await prisma.maintenanceContract.update({ where: { id }, data });
    res.json(contract);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/reschedule', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nextService } = req.body;
    if (!nextService) return res.status(400).json({ error: 'Tanggal service berikutnya wajib diisi.' });
    const contract = await prisma.maintenanceContract.update({
      where: { id },
      data: { nextService }
    });
    res.json(contract);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.maintenanceContract.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Jadwal maintenance berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /check-due — Check maintenance contracts due tomorrow and send notifications
router.post('/check-due', async (req, res) => {
  try {
    const { whatsapp, telegram } = req.body;
    const result = await checkAndNotify(whatsapp, telegram);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /send-overdue — Send overdue maintenance notifications to admin
router.post('/send-overdue', async (req, res) => {
  try {
    const { channel, whatsapp: waBody, telegram: tgBody } = req.body;
    if (!channel || !['whatsapp', 'telegram', 'both'].includes(channel)) {
      return res.status(400).json({ error: 'Channel harus "whatsapp", "telegram", atau "both".' });
    }
    const saved = getNotificationConfig();
    const whatsapp = waBody || saved.whatsapp;
    const telegram = tgBody || saved.telegram;
    const result = await sendOverdueNotifications(whatsapp, telegram, channel);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
