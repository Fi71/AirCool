import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkAndNotify } from './maintenanceNotifier.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, '..', '..', 'notification-config.json');

const MAX_SENDS_PER_HOUR = 5;

let intervalHandle = null;
let lastCheckDate = '';
let hourlySendCount = 0;
let currentHour = -1;
let lastRunTime = null;
let lastRunResult = '';

function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch {}
  return { whatsapp: { enabled: false }, telegram: { enabled: false } };
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch {
    return false;
  }
}

async function runCheck() {
  const now = new Date();
  const hour = now.getHours();
  const today = dateStr(now);

  // Reset hourly counter when hour changes
  if (hour !== currentHour) {
    currentHour = hour;
    hourlySendCount = 0;
  }

  // Daily dedup — only process once per day
  if (today === lastCheckDate) return;
  lastCheckDate = today;

  // Hourly limit
  if (hourlySendCount >= MAX_SENDS_PER_HOUR) {
    console.log(`[Scheduler] Hourly limit reached (${hourlySendCount}/${MAX_SENDS_PER_HOUR}). Skipping.`);
    lastRunTime = now.toISOString();
    lastRunResult = `Hourly limit reached (${hourlySendCount}/${MAX_SENDS_PER_HOUR})`;
    return;
  }

  const config = loadConfig();
  const wa = config.whatsapp;
  const tg = config.telegram;

  if (!wa?.enabled && !tg?.enabled) {
    lastRunTime = now.toISOString();
    lastRunResult = 'No channel enabled';
    return;
  }

  try {
    const maxSends = MAX_SENDS_PER_HOUR - hourlySendCount;
    const result = await checkAndNotify(
      wa.enabled ? wa : { enabled: false },
      tg.enabled ? tg : { enabled: false },
      maxSends
    );
    hourlySendCount += result.sent;
    lastRunTime = now.toISOString();
    if (result.sent > 0) {
      lastRunResult = `${result.sent} sent (${result.total} due, ${result.skipped} skipped)`;
      console.log(`[Scheduler] ${lastRunResult} for ${result.date}`);
    } else if (result.total > 0) {
      lastRunResult = `${result.total} due but 0 sent (${result.skipped} skipped)`;
    } else {
      lastRunResult = 'No contracts due tomorrow';
    }
  } catch (err) {
    lastRunTime = now.toISOString();
    lastRunResult = `Error: ${err.message}`;
    console.error('[Scheduler] Error:', err.message);
  }
}

export function startScheduler() {
  if (intervalHandle) return;

  setTimeout(runCheck, 30000);
  intervalHandle = setInterval(runCheck, 3600000);
  console.log('[Scheduler] Maintenance notification scheduler started (every hour, max 5/hour)');
}

export function stopScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('[Scheduler] Stopped');
  }
}

export function updateNotificationConfig(config) {
  const saved = saveConfig(config);
  lastCheckDate = '';
  return saved;
}

export function getNotificationConfig() {
  return loadConfig();
}

export function getSchedulerStatus() {
  return {
    running: intervalHandle !== null,
    lastRunTime,
    lastRunResult,
    hourlySendCount,
    currentHour,
    maxSendsPerHour: MAX_SENDS_PER_HOUR,
    lastCheckDate
  };
}
