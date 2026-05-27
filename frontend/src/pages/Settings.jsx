import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { sendWhatsAppTest, testWhatsAppConnection } from '../api/api';
import { sendTelegramTest, testTelegramConnection, saveNotificationConfig } from '../api/api';

export default function Settings() {
  const { appSettings, updateSettings } = useApp();
  const [activeTab, setActiveTab] = useState('company');
  const [saved, setSaved] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Percobaan koneksi WhatsApp dari AirCool Management System');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [connLoading, setConnLoading] = useState(false);
  const [connResult, setConnResult] = useState(null);

  const [tgTestLoading, setTgTestLoading] = useState(false);
  const [tgTestResult, setTgTestResult] = useState(null);
  const [tgConnLoading, setTgConnLoading] = useState(false);
  const [tgConnResult, setTgConnResult] = useState(null);

  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSavedMsg, setNotifSavedMsg] = useState(null);

  const tabs = [
    { id: 'company', label: 'Identitas Perusahaan', icon: '🏢' },
    { id: 'whatsapp', label: 'Integrasi WhatsApp', icon: '💬' },
    { id: 'telegram', label: 'Integrasi Telegram', icon: '✈️' },
  ];

  const handleCompanySubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    updateSettings('company', data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleWhatsAppSubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    updateSettings('whatsapp', {
      ...data,
      enabled: e.target.enabled.checked,
      autoSend: e.target.autoSend.checked,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestWhatsApp = async () => {
    if (!testPhone.trim()) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const result = await sendWhatsAppTest({
        apiUrl: appSettings.whatsapp.apiUrl,
        apiKey: appSettings.whatsapp.apiKey,
        sessionId: appSettings.whatsapp.sessionId,
        phoneNumber: testPhone,
        message: testMessage
      });
      setTestResult({ type: 'success', text: 'Pesan berhasil dikirim!' });
    } catch (err) {
      let text = err.message;
      if (err.suggestion) text += '\n\n' + err.suggestion;
      else if (err.version) {
        const ver = err.version;
        text += `\n\nWAHA: v${ver.version || '?'} (${ver.engine || '?'}, ${ver.tier || '?'})`;
        if (ver.version && ver.version < '2026.4.3') {
          text += '\nUpgrade WAHA ke v2026.4.3+ untuk memperbaiki bug pengiriman.';
        }
      }
      setTestResult({ type: 'error', text });
    } finally {
      setTestLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setConnLoading(true);
    setConnResult(null);
    try {
      const result = await testWhatsAppConnection({
        apiUrl: appSettings.whatsapp.apiUrl,
        apiKey: appSettings.whatsapp.apiKey
      });
      const lines = result.steps.map(s => {
        if (s.sessions) {
          return `${s.step}: ${s.status} — ${s.detail}` +
            s.sessions.map(ses => `\n  • ${ses.name} (${ses.status})${ses.me ? ` — ${ses.me}` : ''}`).join('');
        }
        return `${s.step}: ${s.status} — ${s.detail}`;
      });
      setConnResult({ type: 'success', text: lines.join('\n') });
    } catch (err) {
      setConnResult({ type: 'error', text: err.message });
    } finally {
      setConnLoading(false);
    }
  };

  const handleTelegramTestConnection = async () => {
    setTgConnLoading(true);
    setTgConnResult(null);
    try {
      const result = await testTelegramConnection({
        botToken: appSettings.telegram.botToken
      });
      const lines = result.steps.map(s => `${s.step}: ${s.status} — ${s.detail}`);
      setTgConnResult({ type: 'success', text: lines.join('\n') });
    } catch (err) {
      setTgConnResult({ type: 'error', text: err.message });
    } finally {
      setTgConnLoading(false);
    }
  };

  const handleTelegramTestMessage = async () => {
    if (!appSettings.telegram.chatId.trim()) return;
    setTgTestLoading(true);
    setTgTestResult(null);
    try {
      const result = await sendTelegramTest({
        botToken: appSettings.telegram.botToken,
        chatId: appSettings.telegram.chatId,
        message: 'IceCube - Uji Coba\n\nNotifikasi Telegram berhasil!'
      });
      setTgTestResult({ type: 'success', text: 'Pesan berhasil dikirim!' });
    } catch (err) {
      setTgTestResult({ type: 'error', text: err.message });
    } finally {
      setTgTestLoading(false);
    }
  };

  const handleTelegramSubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    updateSettings('telegram', {
      ...data,
      enabled: e.target.enabled.checked,
      autoSend: e.target.autoSend.checked,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveNotifConfig = async () => {
    setNotifSaving(true);
    setNotifSavedMsg(null);
    try {
      await saveNotificationConfig({
        whatsapp: {
          enabled: appSettings.whatsapp.enabled,
          apiUrl: appSettings.whatsapp.apiUrl,
          apiKey: appSettings.whatsapp.apiKey,
          sessionId: appSettings.whatsapp.sessionId,
          phoneNumber: appSettings.whatsapp.phoneNumber,
        },
        telegram: {
          enabled: appSettings.telegram.enabled,
          botToken: appSettings.telegram.botToken,
          chatId: appSettings.telegram.chatId,
        }
      });
      setNotifSavedMsg({ type: 'success', text: 'Konfigurasi notifikasi maintenance otomatis berhasil disimpan ke server.' });
    } catch (err) {
      setNotifSavedMsg({ type: 'error', text: 'Gagal menyimpan: ' + err.message });
    } finally {
      setNotifSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Pengaturan</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Konfigurasi aplikasi dan integrasi</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-700 dark:text-green-300">
          <span>OK</span> Pengaturan berhasil disimpan
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 text-left ${
                  activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 border-transparent'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {activeTab === 'company' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Identitas Perusahaan</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Informasi perusahaan yang akan ditampilkan di sistem</p>

              <form onSubmit={handleCompanySubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Perusahaan</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={appSettings.company.name}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Alamat</label>
                  <textarea
                    name="address"
                    rows={3}
                    defaultValue={appSettings.company.address}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telepon</label>
                    <input
                      type="text"
                      name="phone"
                      defaultValue={appSettings.company.phone}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={appSettings.company.email}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
                    <input
                      type="text"
                      name="website"
                      defaultValue={appSettings.company.website}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Integrasi WhatsApp</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Konfigurasi API WhatsApp untuk notifikasi otomatis</p>

              <form onSubmit={handleWhatsAppSubmit} className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Aktifkan WhatsApp</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Kirim notifikasi via WhatsApp</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="enabled"
                      defaultChecked={appSettings.whatsapp.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API URL</label>
                    <input
                      type="text"
                      name="apiUrl"
                      defaultValue={appSettings.whatsapp.apiUrl}
                      placeholder="https://api.whatsapp.com/send"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Key</label>
                    <input
                      type="password"
                      name="apiKey"
                      defaultValue={appSettings.whatsapp.apiKey}
                      placeholder="Masukkan API key"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nomor Telepon (default)</label>
                    <input
                      type="text"
                      name="phoneNumber"
                      defaultValue={appSettings.whatsapp.phoneNumber}
                      placeholder="628123456789"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Session ID</label>
                    <input
                      type="text"
                      name="sessionId"
                      defaultValue={appSettings.whatsapp.sessionId}
                      placeholder="default"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">Nama session WhatsApp di WAHA</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Kirim Otomatis</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Notifikasi otomatis saat order baru</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="autoSend"
                      defaultChecked={appSettings.whatsapp.autoSend}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                  >
                    Simpan
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">Tes Koneksi</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Periksa apakah server WAHA dapat dijangkau dan session terdaftar</p>
                <div className="space-y-4">
                  {connResult && (
                    <div className={`p-3 rounded-lg text-sm whitespace-pre-line ${
                      connResult.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                    }`}>
                      {connResult.text}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={connLoading || !appSettings.whatsapp.apiUrl}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
                  >
                    {connLoading ? 'Mengecek...' : 'Tes Koneksi'}
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">Uji Coba Pesan</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Kirim pesan percobaan untuk memastikan koneksi WAHA berfungsi</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nomor Tujuan</label>
                    <input
                      type="text"
                      value={testPhone}
                      onChange={e => setTestPhone(e.target.value)}
                      placeholder="628123456789"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">Format internasional tanpa tanda +, contoh: 628123456789</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pesan</label>
                    <textarea
                      value={testMessage}
                      onChange={e => setTestMessage(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {testResult && (
                    <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                      testResult.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                    }`}>
                      <span>{testResult.type === 'success' ? 'OK' : 'X'}</span>
                      {testResult.text}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleTestWhatsApp}
                    disabled={testLoading || !testPhone.trim()}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
                  >
                    {testLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Mengirim...
                      </>
                    ) : (
                      <>
                        Kirim Pesan Uji Coba
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'telegram' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Integrasi Telegram</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Konfigurasi Bot Telegram untuk notifikasi otomatis</p>

              <form onSubmit={handleTelegramSubmit} className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Aktifkan Telegram</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Kirim notifikasi via Telegram bot</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="enabled"
                      defaultChecked={appSettings.telegram.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bot Token</label>
                    <input
                      type="password"
                      name="botToken"
                      defaultValue={appSettings.telegram.botToken}
                      placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chat ID</label>
                    <input
                      type="text"
                      name="chatId"
                      defaultValue={appSettings.telegram.chatId}
                      placeholder="-123456789"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Kirim Otomatis</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Notifikasi otomatis saat order baru</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="autoSend"
                      defaultChecked={appSettings.telegram.autoSend}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                  >
                    Simpan
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">Tes Koneksi</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Verifikasi token bot dan lihat daftar chat terbaru</p>
                <div className="space-y-4">
                  {tgConnResult && (
                    <div className={`p-3 rounded-lg text-sm whitespace-pre-line ${
                      tgConnResult.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                    }`}>
                      {tgConnResult.text}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleTelegramTestConnection}
                    disabled={tgConnLoading || !appSettings.telegram.botToken}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
                  >
                    {tgConnLoading ? 'Mengecek...' : 'Tes Koneksi'}
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">Uji Coba Pesan</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Kirim pesan percobaan ke chat ID yang sudah disimpan</p>
                <div className="space-y-4">
                  {tgTestResult && (
                    <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                      tgTestResult.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                    }`}>
                      <span>{tgTestResult.type === 'success' ? 'OK' : 'X'}</span>
                      {tgTestResult.text}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleTelegramTestMessage}
                    disabled={tgTestLoading || !appSettings.telegram.botToken || !appSettings.telegram.chatId}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
                  >
                    {tgTestLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Mengirim...
                      </>
                    ) : (
                      <>
                        Kirim Pesan Uji Coba
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notification config save bar — visible on all tabs */}
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Notifikasi Maintenance Otomatis (H-1)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Server akan mengecek setiap jam dan mengirim notifikasi ke WhatsApp customer + Telegram admin untuk jadwal maintenance besok.
                  {appSettings.whatsapp.enabled || appSettings.telegram.enabled
                    ? ' Konfigurasi sudah diatur.'
                    : ' Aktifkan WhatsApp dan/atau Telegram di atas terlebih dahulu.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveNotifConfig}
                disabled={notifSaving || (!appSettings.whatsapp.enabled && !appSettings.telegram.enabled)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium whitespace-nowrap"
              >
                {notifSaving ? 'Menyimpan...' : 'Simpan Konfigurasi ke Server'}
              </button>
            </div>
            {notifSavedMsg && (
              <div className={`mt-2 p-2 rounded text-xs ${
                notifSavedMsg.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}>
                {notifSavedMsg.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
