import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { sendOverdueNotification } from '../api/api';

export default function Maintenance() {
  const { maintenance, customers, addMaintenance, deleteMaintenance, updateMaintenance, appSettings } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [notifLoading, setNotifLoading] = useState(null);
  const [notifMsg, setNotifMsg] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [formData, setFormData] = useState({
    customerId: '',
    unit: '',
    interval: 3,
    startDate: '',
    notes: ''
  });

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === parseInt(formData.customerId));
    if (customer) {
      const today = new Date();
      const lastService = new Date(today);
      lastService.setMonth(lastService.getMonth() - parseInt(formData.interval));
      const nextService = new Date(today);
      nextService.setMonth(nextService.getMonth() + parseInt(formData.interval));

      await addMaintenance({
        customerId: parseInt(formData.customerId),
        customerName: customer.name,
        address: customer.address,
        phone: customer.phone,
        unit: formData.unit,
        interval: parseInt(formData.interval),
        lastService: lastService.toISOString().split('T')[0],
        nextService: nextService.toISOString().split('T')[0],
        isActive: true,
        notes: formData.notes
      });
      setShowForm(false);
      setFormData({ customerId: '', unit: '', interval: 3, startDate: '', notes: '' });
    }
  };

  const getStatusColor = (isActive) => {
    return isActive
      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Aktif' : 'Tidak Aktif';
  };

  const getStatusIcon = (nextService) => {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = new Date();
    upcoming.setDate(upcoming.getDate() + 1);

    if (nextService < today) {
      return '\uD83D\uDEA8';
    } else if (nextService < upcoming.toISOString().split('T')[0]) {
      return '\u26A0\uFE0F';
    } else {
      return '\uD83D\uDCC5';
    }
  };

  const calculateDaysUntil = (nextService) => {
    const today = new Date();
    const due = new Date(nextService);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSendOverdue = async (channel) => {
    setNotifLoading(channel);
    setNotifMsg(null);
    try {
      const body = { channel };
      if (channel === 'telegram' || channel === 'both') {
        body.telegram = appSettings.telegram;
      }
      if (channel === 'whatsapp' || channel === 'both') {
        body.whatsapp = appSettings.whatsapp;
      }
      const res = await sendOverdueNotification(body);
      if (res.sent > 0) {
        setNotifMsg({ type: 'success', text: `${res.sent} notifikasi terkirim ke admin dari ${res.total} jadwal jatuh tempo besok.` });
      } else if (res.total > 0) {
        setNotifMsg({ type: 'error', text: res.message || `Ditemukan ${res.total} jadwal, tetapi gagal mengirim notifikasi.` });
      } else {
        setNotifMsg({ type: 'info', text: res.message || 'Tidak ada jadwal jatuh tempo besok.' });
      }
    } catch (err) {
      setNotifMsg({ type: 'error', text: err.message });
    } finally {
      setNotifLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Maintenance Berkala</h2>
          <p className="text-gray-500 dark:text-gray-400">Kelola jadwal maintenance pelanggan</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Tambah Jadwal</span>
        </button>
        <div className="flex space-x-2">
          <button
            onClick={() => handleSendOverdue('telegram')}
            disabled={notifLoading !== null}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            <span>{notifLoading === 'telegram' ? 'Mengirim...' : 'Telegram'}</span>
          </button>
          <button
            onClick={() => handleSendOverdue('whatsapp')}
            disabled={notifLoading !== null}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            <span>{notifLoading === 'whatsapp' ? 'Mengirim...' : 'WhatsApp'}</span>
          </button>
        </div>
      </div>

      {notifMsg && (
        <div className={`p-4 rounded-lg text-sm ${
          notifMsg.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
          notifMsg.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
        }`}>
          <div className="flex items-center justify-between">
            <span>{notifMsg.text}</span>
            <button onClick={() => setNotifMsg(null)} className="ml-2 text-current opacity-60 hover:opacity-100">&times;</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Pelanggan</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{maintenance.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Maintenance Aktif</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {maintenance.filter(m => m.isActive).length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <p className="text-sm text-red-600 dark:text-red-400 mb-1">Jatuh Tempo Hari Ini</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {maintenance.filter(m => m.nextService === new Date().toISOString().split('T')[0]).length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <p className="text-sm text-orange-600 dark:text-orange-400 mb-1">Kedaluwarsa</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {maintenance.filter(m => m.nextService < new Date().toISOString().split('T')[0]).length}
          </p>
        </div>
      </div>

      {/* Maintenance List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Daftar Maintenance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Interval
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Terakhir Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Jatuh Tempo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {maintenance.map(m => {
                const daysUntil = calculateDaysUntil(m.nextService);
                const isOverdue = m.nextService < new Date().toISOString().split('T')[0];

                return (
                  <tr key={m.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isOverdue ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                      {m.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {m.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {m.interval} bulan
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {m.lastService}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xl ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
                          {getStatusIcon(m.nextService)}
                        </span>
                        <span className={`font-semibold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                          {m.nextService}
                        </span>
                        {isOverdue ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded text-xs">Kedaluwarsa</span>
                        ) : daysUntil <= 7 ? (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 rounded text-xs">H-{daysUntil}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(m.isActive)}`}>
                        {getStatusText(m.isActive)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => setDeleteConfirm(m)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-all text-xs"
                      >
                        Hapus
                      </button>
                      <button
                        onClick={() => {
                          setRescheduleModal(m);
                          setRescheduleDate(m.nextService);
                        }}
                        className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition-all text-xs"
                      >
                        Reschedule
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Maintenance Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Tambah Jadwal Maintenance</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddMaintenance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Pilih customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Unit AC
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="Contoh: Split 1 PK, Inverter 1/2 PK"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interval Service (Bulan)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sistem akan menghitung jatuh tempo otomatis</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan tambahan tentang pelanggan..."
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  Simpan Jadwal
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Hapus Maintenance</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Apakah Anda yakin ingin menghapus maintenance <strong>{deleteConfirm.customerName}</strong>?
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={async () => { await deleteMaintenance(deleteConfirm.id); setDeleteConfirm(null); }}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                Hapus
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Reschedule Maintenance - {rescheduleModal.customerName}
              </h3>
              <button
                onClick={() => setRescheduleModal(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-1 text-sm">
                <p><span className="text-gray-500">Customer:</span> <span className="font-medium text-gray-900 dark:text-gray-100">{rescheduleModal.customerName}</span></p>
                <p><span className="text-gray-500">Unit:</span> <span className="text-gray-900 dark:text-gray-100">{rescheduleModal.unit}</span></p>
                <p><span className="text-gray-500">Jatuh Tempo Saat Ini:</span> <span className="font-semibold text-orange-600">{rescheduleModal.nextService}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tanggal Jatuh Tempo Baru
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={async () => {
                    if (rescheduleDate) {
                      await updateMaintenance(rescheduleModal.id, { nextService: rescheduleDate });
                      setRescheduleModal(null);
                    }
                  }}
                  className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all"
                >
                  Simpan Perubahan
                </button>
                <button
                  onClick={() => setRescheduleModal(null)}
                  className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">{'\uD83D\uDCA1'} Fitur Maintenance</h3>
        <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
          <li className="flex items-start space-x-2">
            <span className="text-xl">{'\uD83D\uDCC5'}</span>
            <span>Sistem akan otomatis menghitung jatuh tempo maintenance berikutnya</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-xl">{'\uD83D\uDCF1'}</span>
            <span>Notifikasi akan dikirim via Telegram ke admin sebelum jatuh tempo (H-1)</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-xl">{'\uD83D\uDD04'}</span>
            <span>Admin dapat melakukan reschedule manual jika ada permintaan pelanggan</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-xl">{'\uD83D\uDCCA'}</span>
            <span>Dashboard menampilkan jadwal maintenance yang jatuh tempo bulan ini</span>
          </li>
        </ul>
      </div>
    </div>
  );
}