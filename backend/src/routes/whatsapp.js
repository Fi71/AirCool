import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/send-notification', authenticate, async (req, res) => {
  try {
    const { apiUrl, apiKey, phoneNumber, order, sessionId } = req.body;

    if (!apiUrl || !phoneNumber || !order) {
      return res.status(400).json({ error: 'API URL, nomor telepon, dan data order wajib diisi.' });
    }

    const message = `🔧 *AirCool - Notifikasi Order Baru*\n\n` +
      `*Order #${order.id}*\n` +
      `*Customer:* ${order.customerName}\n` +
      `*Tipe:* ${order.type === 'service' ? 'Service' : 'Penjualan'}\n` +
      `*Total:* Rp ${(order.totalCost || 0).toLocaleString('id-ID')}\n` +
      `*Tanggal:* ${order.createdAt || new Date().toISOString().split('T')[0]}\n\n` +
      `_Status: ${order.status || 'ORDER'}_`;

    const chatId = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@c.us`;
    const wahaUrl = apiUrl.replace(/\/$/, '');

    const response = await wahaFetch(wahaUrl, apiKey, sessionId, chatId, message);

    const rawBody = await response.text();
    let result;
    try {
      result = JSON.parse(rawBody);
    } catch {
      return res.status(502).json({
        error: `Respon WAHA bukan JSON (HTTP ${response.status})`,
        detail: rawBody?.substring(0, 800) || '(kosong)'
      });
    }

    if (!response.ok) {
      return res.status(502).json({ error: `WAHA error: ${result.message || result.error || response.statusText}`, detail: result });
    }

    res.json({ success: true, message: 'Notifikasi terkirim', result });
  } catch (err) {
    res.status(502).json({ error: `Gagal kirim notifikasi: ${err.message}` });
  }
});

async function wahaFetch(wahaUrl, apiKey, sessionId, chatId, text) {
  const session = sessionId || 'default';
  const h = { 'Content-Type': 'application/json' };
  if (apiKey) h['X-Api-Key'] = apiKey;
  let lastError = null;

  const attempt2xx = async (url, options) => {
    try {
      const r = await fetch(url, { ...options, signal: AbortSignal.timeout(10000) });
      if (r.ok) return r;
      lastError = { url: url.split('?')[0], status: r.status };
      const body = await r.text().catch(() => '');
      try { lastError.body = JSON.parse(body); } catch { lastError.body = body?.substring(0, 200); }
    } catch (e) {
      lastError = { url: url.split('?')[0], status: 'NETWORK', body: e.message };
    }
    return null;
  };

  // Strategy 1: POST /api/sendText with all body variants that include session
  const bodyVariants = [
    { session, chatId, text },
    { session, chatId, text, linkPreview: false },
    { session, chatId, text, linkPreview: false, linkPreviewHighQuality: false },
    { session, phone: chatId.replace(/@.*$/, ''), text },
  ];
  for (const body of bodyVariants) {
    const r = await attempt2xx(`${wahaUrl}/api/sendText`, {
      method: 'POST', headers: h, body: JSON.stringify(body)
    });
    if (r) return r;
  }

  // Strategy 2: GET /api/sendText (deprecated GOWS fallback)
  const phone = chatId.includes('@') ? chatId : `${chatId}@c.us`;
  for (const s of [session, 'default']) {
    const q = `phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&session=${encodeURIComponent(s)}`;
    const r = await attempt2xx(`${wahaUrl}/api/sendText?${q}`, { method: 'GET', headers: h });
    if (r) return r;
  }

  // Strategy 3: POST /api/{session}/messages/text (legacy session-prefixed)
  {
    const r = await attempt2xx(`${wahaUrl}/api/${encodeURIComponent(session)}/messages/text`, {
      method: 'POST', headers: h, body: JSON.stringify({ chatId, text })
    });
    if (r) return r;
  }

  // Strategy 4: POST /api/sendText with session in query param (alternative format)
  {
    const r = await attempt2xx(`${wahaUrl}/api/sendText?session=${encodeURIComponent(session)}`, {
      method: 'POST', headers: h, body: JSON.stringify({ chatId, text })
    });
    if (r) return r;
  }

  // All strategies failed — return the last error's full response or throw
  if (lastError) {
    // Try one more time with the standard format and longer timeout for accurate error
    const r = await fetch(`${wahaUrl}/api/sendText`, {
      method: 'POST', headers: h,
      body: JSON.stringify({ session, chatId, text }),
      signal: AbortSignal.timeout(15000)
    });
    return r;
  }

  // Fallback
  return fetch(`${wahaUrl}/api/sendText`, {
    method: 'POST', headers: h,
    body: JSON.stringify({ session, chatId, text }),
    signal: AbortSignal.timeout(15000)
  });
}

router.post('/test-connection', async (req, res) => {
  try {
    const { apiUrl, apiKey } = req.body;
    if (!apiUrl) return res.status(400).json({ error: 'API URL wajib diisi.' });

    const wahaUrl = apiUrl.replace(/\/$/, '');
    const steps = [];

    async function doFetch(path, headerKey, headerVal) {
      const h = { 'Content-Type': 'application/json' };
      if (headerKey) h[headerKey] = headerVal;
      try {
        const r = await fetch(`${wahaUrl}${path}`, { headers: h, signal: AbortSignal.timeout(8000) });
        const text = await r.text();
        let json;
        try { json = JSON.parse(text); } catch { json = null; }
        return { status: r.status, body: text?.substring(0, 200), json };
      } catch (e) {
        return { status: 'ERROR', body: e.message };
      }
    }

    // Step 1: health — try with and without auth
    steps.push({ step: 'GET /api/health (no auth)', ...(await doFetch('/api/health')) });
    if (apiKey) {
      steps.push({ step: 'GET /api/health (X-Api-Key)', ...(await doFetch('/api/health', 'X-Api-Key', apiKey)) });
    }

    // Step 2: version info
    if (apiKey) {
      const v = await doFetch('/api/version', 'X-Api-Key', apiKey);
      const versionInfo = v.json || {};
      steps.push({
        step: 'Version', status: `HTTP ${v.status}`,
        detail: versionInfo.version ? `v${versionInfo.version} (${versionInfo.engine || '?'}, ${versionInfo.tier || '?'})` : (v.body || '')
      });
    } else {
      steps.push({ step: 'Version', status: 'SKIPPED', detail: 'API key diperlukan untuk mengambil info versi' });
    }

    // Step 3: find working auth
    let workingAuth = null;
    const authMethods = [];
    if (apiKey) {
      for (const [key, val] of [['Authorization', `Bearer ${apiKey}`], ['X-Api-Key', apiKey]]) {
        const r = await doFetch('/api/sessions', key, val);
        authMethods.push({ header: key, status: `HTTP ${r.status}` });
        if (r.status === 200 && r.json) workingAuth = { key, val };
      }
    } else {
      const r = await doFetch('/api/sessions');
      authMethods.push({ header: '(none)', status: `HTTP ${r.status}` });
      if (r.status === 200) workingAuth = {};
    }
    steps.push({ step: 'Auth test', methods: authMethods, working: workingAuth?.key || '(none)' });

    // Step 4: sessions list
    if (workingAuth) {
      const r = await doFetch('/api/sessions', workingAuth.key, workingAuth.val);
      if (r.status === 200 && r.json) {
        const sessions = Array.isArray(r.json) ? r.json : [];
        steps.push({
          step: 'Sessions', status: 'OK',
          detail: `${sessions.length} session ditemukan`,
          sessions: sessions.map(s => ({
            name: s.name || s.id || '?',
            status: s.status || '?',
            me: typeof s.me === 'object' ? (s.me?.pushname || JSON.stringify(s.me)) : (s.me || '?')
          }))
        });
      } else {
        steps.push({ step: 'Sessions', status: `HTTP ${r.status}`, detail: r.body });
      }
    }

    // Step 5: detect send endpoints from Swagger docs
    const docsUrls = ['/api/docs-json', '/docs-json', '/swagger/json', '/api/swagger.json', '/api/openapi.json', '/openapi.json'];
    for (const docsPath of docsUrls) {
      try {
        const r = await fetch(`${wahaUrl}${docsPath}`, { signal: AbortSignal.timeout(5000) });
        if (!r.ok) continue;
        const text = await r.text();
        let spec;
        try { spec = JSON.parse(text); } catch { continue; }
        if (!spec?.paths) continue;
        steps.push({ step: `Swagger: ${docsPath}`, status: 'OK', detail: `${Object.keys(spec.paths).length} endpoint terdaftar` });
        const sendEndpoints = [];
        for (const [path, methods] of Object.entries(spec.paths)) {
          if (methods?.post) {
            const body = methods.post;
            const tags = (body.tags || []).join(',');
            const summary = body.summary || '';
            if (/send|message|text/i.test(path + summary + tags)) {
              sendEndpoints.push({ path, summary, tags });
            }
          }
        }
        if (sendEndpoints.length > 0) {
          const ep = sendEndpoints[0];
          steps.push({
            step: 'Send endpoint',
            status: 'DETECTED',
            detail: `${ep.path} — ${ep.summary || ep.tags || '(no desc)'}`
          });
          steps.push({
            step: 'All send-related endpoints',
            detail: sendEndpoints.map(e => `${e.path} (${e.summary || e.tags || '?'})`).join('\n')
          });
        } else {
          steps.push({ step: 'Send endpoint', status: 'NOT FOUND', detail: 'Tidak ada endpoint send/message' });
        }
        break;
      } catch {}
    }

    // Step 6: try a live send test (mode: dry-run, just see what happens)
    if (workingAuth && apiKey) {
      const sessionInfo = await doFetch('/api/sessions', workingAuth.key, workingAuth.val);
      const sessions = (sessionInfo.json && Array.isArray(sessionInfo.json)) ? sessionInfo.json : [];
      const workingSession = sessions.find(s => s.status === 'WORKING');
      if (workingSession) {
        const sessionName = workingSession.name || workingSession.id || 'default';
        const me = typeof workingSession.me === 'object' ? JSON.stringify(workingSession.me) : (workingSession.me || '');
        steps.push({
          step: 'Send test (dry-run)', status: 'READY',
          detail: `Session "${sessionName}" bekerja${me ? ` — ${me}` : ''}`,
          note: 'Buka tab "Uji Coba Pesan" untuk mengirim pesan nyata.'
        });
      } else if (sessions.length > 0) {
        const s = sessions[0];
        steps.push({
          step: 'Send test (dry-run)', status: `Session "${s.name || s.id || '?'}" = ${s.status || '?'}`,
          detail: 'Session belum dalam status WORKING. Scan QR code di dashboard WAHA.'
        });
      }
    }

    res.json({ success: true, steps });
  } catch (err) {
    res.status(502).json({ error: `Gagal test koneksi: ${err.message}` });
  }
});

router.post('/test', async (req, res) => {
  try {
    const { apiUrl, apiKey, phoneNumber, message, sessionId } = req.body;

    if (!apiUrl || !phoneNumber || !message) {
      return res.status(400).json({ error: 'API URL, nomor telepon, dan pesan wajib diisi.' });
    }

    const chatId = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@c.us`;
    const wahaUrl = apiUrl.replace(/\/$/, '');

    // Diagnostic: grab version info
    const diagHeaders = { 'Content-Type': 'application/json' };
    if (apiKey) diagHeaders['X-Api-Key'] = apiKey;
    let diagResult = null;
    let versionInfo = null;
    try {
      const [diag, ver] = await Promise.all([
        fetch(`${wahaUrl}/api/sessions`, { headers: diagHeaders, signal: AbortSignal.timeout(10000) }),
        fetch(`${wahaUrl}/api/version`, { headers: diagHeaders, signal: AbortSignal.timeout(10000) }).catch(() => null)
      ]);
      const diagBody = await diag.text();
      diagResult = { status: diag.status, body: diagBody?.substring(0, 200) };
      if (ver && ver.ok) {
        try { versionInfo = await ver.json(); } catch {}
      }
    } catch (e) {
      diagResult = { status: 'ERROR', body: e.message };
    }

    const response = await wahaFetch(wahaUrl, apiKey, sessionId, chatId, message);

    const rawBody = await response.text();
    let result;
    try {
      result = JSON.parse(rawBody);
    } catch {
      return res.status(502).json({
        error: `WAHA API error (HTTP ${response.status}) — body bukan JSON`,
        detail: rawBody?.substring(0, 800) || '(kosong)',
        diag: diagResult,
        version: versionInfo
      });
    }

    if (!response.ok) {
      const msg = result?.message || result?.error || result?.title || JSON.stringify(result);
      const diagMsg = diagResult ? `[Sessions test: HTTP ${diagResult.status} ${diagResult.body?.substring(0, 100)}]` : '';

      // Detect gRPC errors and suggest upgrade
      let suggestion = '';
      if (msg && msg.includes('server returned error')) {
        const ver = versionInfo?.version || '';
        if (ver && ver < '2026.4.3') {
          suggestion = `WAHA ${versionInfo?.engine || ''} v${ver} memiliki bug tctoken yang menyebabkan error ini. Upgrade WAHA ke v2026.4.3+ atau hubungi sumopod support untuk ganti engine ke WEBJS.`;
        } else {
          suggestion = 'Kontak mungkin belum pernah menerima pesan dari nomor ini sebelumnya. Coba kirim ke nomor yang sudah ada riwayat chat.';
        }
      }

      return res.status(502).json({
        error: `WAHA API error (HTTP ${response.status}): ${msg?.substring(0, 200)} ${diagMsg}`,
        detail: result,
        diag: diagResult,
        version: versionInfo,
        suggestion
      });
    }

    res.json({ success: true, message: 'Pesan berhasil dikirim', result, version: versionInfo });
  } catch (err) {
    res.status(502).json({ error: `Gagal terhubung ke WAHA: ${err.message}` });
  }
});

export default router;
