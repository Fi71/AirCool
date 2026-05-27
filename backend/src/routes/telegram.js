import { Router } from 'express';

const router = Router();

const TG_API = 'https://api.telegram.org';

router.post('/test-connection', async (req, res) => {
  try {
    const { botToken } = req.body;
    if (!botToken) return res.status(400).json({ error: 'Bot token wajib diisi.' });

    const steps = [];

    // Step 1: getMe
    try {
      const r = await fetch(`${TG_API}/bot${botToken}/getMe`, { signal: AbortSignal.timeout(10000) });
      const data = await r.json();
      steps.push({
        step: 'getMe',
        status: r.ok && data.ok ? 'OK' : `HTTP ${r.status}`,
        detail: data.ok ? `Bot: @${data.result.username} (${data.result.first_name || ''})` : (data.description || JSON.stringify(data))
      });
    } catch (e) {
      steps.push({ step: 'getMe', status: 'ERROR', detail: e.message });
    }

    // Step 2: getUpdates (check if bot has received any messages)
    try {
      const r = await fetch(`${TG_API}/bot${botToken}/getUpdates?limit=5`, { signal: AbortSignal.timeout(10000) });
      const data = await r.json();
      if (data.ok && data.result) {
        const chats = new Map();
        for (const update of data.result) {
          const msg = update.message || update.channel_post || update.callback_query?.message;
          if (msg?.chat) {
            const chat = msg.chat;
            const key = chat.id;
            if (!chats.has(key)) {
              chats.set(key, { id: chat.id, type: chat.type, title: chat.title || `${chat.first_name || ''} ${chat.last_name || ''}`.trim() || chat.username || String(chat.id) });
            }
          }
        }
        steps.push({
          step: 'Recent chats',
          status: 'OK',
          detail: chats.size > 0
            ? `${chats.size} chat ditemukan:\n` + [...chats.values()].map(c => `  • ${c.title} (${c.type}, id: ${c.id})`).join('\n')
            : 'Belum ada chat. Kirim pesan ke bot dulu di Telegram.'
        });
      } else {
        steps.push({ step: 'Recent chats', status: `HTTP ${r.status}`, detail: data.description || JSON.stringify(data) });
      }
    } catch (e) {
      steps.push({ step: 'Recent chats', status: 'ERROR', detail: e.message });
    }

    res.json({ success: true, steps });
  } catch (err) {
    res.status(502).json({ error: `Gagal test koneksi Telegram: ${err.message}` });
  }
});

router.post('/send-notification', async (req, res) => {
  try {
    const { botToken, chatId, title, message } = req.body;
    if (!botToken || !chatId) {
      return res.status(400).json({ error: 'Bot token dan chat ID wajib diisi.' });
    }

    const text = title
      ? `*${title}*\n\n${message}`
      : message;

    const r = await fetch(`${TG_API}/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
      signal: AbortSignal.timeout(15000)
    });

    const data = await r.json();

    if (!r.ok || !data.ok) {
      return res.status(502).json({
        error: `Telegram API error: ${data.description || r.statusText}`,
        detail: data
      });
    }

    res.json({ success: true, message: 'Notifikasi terkirim', result: data.result });
  } catch (err) {
    res.status(502).json({ error: `Gagal kirim notifikasi Telegram: ${err.message}` });
  }
});

router.post('/test', async (req, res) => {
  try {
    const { botToken, chatId, message } = req.body;
    if (!botToken || !chatId || !message) {
      return res.status(400).json({ error: 'Bot token, chat ID, dan pesan wajib diisi.' });
    }

    const r = await fetch(`${TG_API}/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' }),
      signal: AbortSignal.timeout(15000)
    });

    const data = await r.json();

    if (!r.ok || !data.ok) {
      return res.status(502).json({
        error: `Telegram API error: ${data.description || r.statusText}`,
        detail: data
      });
    }

    res.json({ success: true, message: 'Pesan berhasil dikirim', result: data.result });
  } catch (err) {
    res.status(502).json({ error: `Gagal terhubung ke Telegram: ${err.message}` });
  }
});

export default router;
