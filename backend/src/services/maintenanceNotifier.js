import prisma from '../config/supabase.js';

const TG_API = 'https://api.telegram.org';

function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysUntilNextService(dateStr) {
  const today = todayMidnight();
  const target = new Date(dateStr + 'T00:00:00');
  if (isNaN(target.getTime())) return NaN;
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sendWA(wahaUrl, apiKey, sessionId, chatId, text) {
  const h = { 'Content-Type': 'application/json' };
  if (apiKey) h['X-Api-Key'] = apiKey;
  return fetch(`${wahaUrl}/api/sendText`, {
    method: 'POST', headers: h,
    body: JSON.stringify({ session: sessionId || 'default', chatId, text }),
    signal: AbortSignal.timeout(15000)
  });
}

function sendTG(botToken, chatId, text) {
  return fetch(`${TG_API}/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    signal: AbortSignal.timeout(15000)
  });
}

function getDueTomorrow(contracts) {
  return contracts.filter(c => {
    const diff = daysUntilNextService(c.nextService);
    return diff === 1;
  });
}

export async function checkAndNotify(whatsapp, telegram, maxSends = 0) {
  const tom = tomorrowStr();

  const contracts = await prisma.maintenanceContract.findMany({
    where: { isActive: true },
    include: { customer: true }
  });

  const dueTomorrow = getDueTomorrow(contracts);
  const toProcess = maxSends > 0 ? dueTomorrow.slice(0, maxSends) : dueTomorrow;

  if (dueTomorrow.length === 0) {
    return { sent: 0, skipped: 0, message: 'Tidak ada jadwal maintenance besok.', contracts: [] };
  }

  let sent = 0;
  let skipped = 0;

  for (const c of toProcess) {
    const customerName = c.customerName || c.customer?.name || 'Customer';
    const msg = `🧊 *AirCool - Pengingat Maintenance*\n\nMaintenance berkala jatuh tempo *besok (${tom})*:\n\n• ${customerName}\n• ${c.address || '-'}\n• ${c.phone || '-'}\n• Unit: ${c.unit || '-'}\n• Interval: ${c.interval} bulan`;

    // WhatsApp — send to admin if phone number configured
    if (whatsapp?.enabled && whatsapp.apiUrl && whatsapp.phoneNumber) {
      try {
        const wahaUrl = whatsapp.apiUrl.replace(/\/$/, '');
        const chatId = whatsapp.phoneNumber.includes('@') ? whatsapp.phoneNumber : `${whatsapp.phoneNumber}@c.us`;
        const r = await sendWA(wahaUrl, whatsapp.apiKey, whatsapp.sessionId, chatId, msg);
        if (r.ok) sent++; else skipped++;
      } catch { skipped++; }
    }

    // Telegram — send to admin if chat ID configured
    if (telegram?.enabled && telegram.botToken && telegram.chatId) {
      try {
        const r = await sendTG(telegram.botToken, telegram.chatId, msg);
        const data = await r.json();
        if (r.ok && data.ok) sent++; else skipped++;
      } catch { skipped++; }
    }
  }

  try {
    await prisma.notification.create({
      data: {
        type: 'maintenance',
        message: `${sent} notifikasi maintenance terkirim (${skipped} gagal) untuk ${dueTomorrow.length} jadwal besok`,
        channels: JSON.stringify(whatsapp?.phoneNumber && telegram?.chatId ? ['whatsapp', 'telegram'] : whatsapp?.phoneNumber ? ['whatsapp'] : ['telegram']),
        status: sent > 0 ? 'sent' : 'failed'
      }
    });
  } catch {}

  return {
    sent,
    skipped,
    total: dueTomorrow.length,
    limited: maxSends > 0 && dueTomorrow.length > maxSends,
    date: tom,
    contracts: toProcess.map(c => ({
      id: c.id,
      customerName: c.customerName || c.customer?.name,
      phone: c.phone || c.customer?.phone,
      nextService: c.nextService
    }))
  };
}

export async function sendOverdueNotifications(whatsapp, telegram, channel) {
  const tom = tomorrowStr();

  const contracts = await prisma.maintenanceContract.findMany({
    where: { isActive: true },
    include: { customer: true }
  });

  const dueTomorrow = getDueTomorrow(contracts);

  if (dueTomorrow.length === 0) {
    return { sent: 0, message: 'Tidak ada jadwal maintenance yang jatuh tempo besok.', contracts: [] };
  }

  const lines = dueTomorrow.map((c, i) => {
    const name = c.customerName || c.customer?.name || 'Customer';
    return `${i + 1}. ${name} - ${c.unit || '-'} - ${c.address || '-'} - ${c.phone || '-'} - Jatuh tempo: ${c.nextService}`;
  });

  const header = `🧊 *AirCool - Pengingat Maintenance Jatuh Tempo*\n\nBerikut adalah ${dueTomorrow.length} jadwal maintenance yang jatuh tempo *besok (${tom})*:\n\n`;
  const footer = `\n\nSegera lakukan tindakan lanjutan.`;
  const fullText = header + lines.join('\n') + footer;

  let sent = 0;
  let failReason = null;

  if (channel === 'whatsapp' || channel === 'both') {
    if (whatsapp?.enabled && whatsapp.apiUrl && whatsapp.phoneNumber) {
      const wahaUrl = whatsapp.apiUrl.replace(/\/$/, '');
      const chatId = whatsapp.phoneNumber.includes('@') ? whatsapp.phoneNumber : `${whatsapp.phoneNumber}@c.us`;
      try {
        const r = await sendWA(wahaUrl, whatsapp.apiKey, whatsapp.sessionId, chatId, fullText);
        if (r.ok) sent++;
      } catch {}
    } else {
      failReason = 'Konfigurasi WhatsApp belum disimpan di server atau belum diaktifkan.';
    }
  }

  if (channel === 'telegram' || channel === 'both') {
    if (telegram?.enabled && telegram.botToken && telegram.chatId) {
      try {
        const r = await sendTG(telegram.botToken, telegram.chatId, fullText);
        const data = await r.json();
        if (r.ok && data.ok) sent++;
      } catch {}
    } else {
      failReason = 'Konfigurasi Telegram belum disimpan di server atau belum diaktifkan.';
    }
  }

  const message = sent > 0
    ? undefined
    : (failReason || `Gagal mengirim notifikasi via ${channel}.`);

  return {
    sent,
    total: dueTomorrow.length,
    message,
    contracts: dueTomorrow.map(c => ({
      id: c.id,
      customerName: c.customerName || c.customer?.name,
      phone: c.phone || c.customer?.phone,
      nextService: c.nextService
    }))
  };
}
