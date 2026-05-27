import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import * as api from '../api/api';

export default function Tools() {
  const { loadAllData, orders, products, customers, maintenance } = useApp();
  const [loading, setLoading] = useState(null);
  const [result, setResult] = useState(null);
  const [confirmClear, setConfirmClear] = useState(null);

  const handleClear = async (type) => {
    setLoading(type);
    setResult(null);
    try {
      if (type === 'transactions') {
        await api.clearTransactions();
      } else {
        await api.clearMaster();
      }
      setResult({ success: true, message: `Data ${type === 'transactions' ? 'transaksi' : 'master & transaksi'} berhasil dikosongkan.` });
      await loadAllData();
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setLoading(null);
      setConfirmClear(null);
    }
  };

  const stats = [
    { label: 'Total Produk', value: products.length, color: 'text-blue-600' },
    { label: 'Total Pelanggan', value: customers.length, color: 'text-green-600' },
    { label: 'Total Order', value: orders.length, color: 'text-purple-600' },
    { label: 'Total Maintenance', value: maintenance.length, color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Tools</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Alat bantu administrasi sistem</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Result message */}
      {result && (
        <div className={`p-4 rounded-xl ${result.success ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'}`}>
          <div className="flex items-center gap-2">
            <span>{result.success ? '✅' : '❌'}</span>
            <p className="font-medium">{result.message}</p>
          </div>
        </div>
      )}

      {/* Warning info */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0 mt-0.5">⚠️</span>
          <div>
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Perhatian!</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Tools ini akan menghapus data secara permanen. Pastikan Anda telah melakukan backup data sebelum melanjutkan.
            </p>
          </div>
        </div>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clear Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🗑️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Kosongkan Data Transaksi</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Menghapus semua data transaksi: Order, Pembayaran, Riwayat Service, Inventory Entry, Notifikasi, dan Maintenance.
              Data Master (Produk, Pelanggan, User, Jasa) tetap aman.
            </p>
            <ul className="text-xs text-gray-400 dark:text-gray-500 space-y-1 mb-4">
              <li>✓ Order & Laporan Teknisi</li>
              <li>✓ Pembayaran</li>
              <li>✓ Pergerakan Stok (IN/OUT)</li>
              <li>✓ Maintenance & Notifikasi</li>
              <li className="text-green-600 dark:text-green-400">✗ Produk, Pelanggan, User, Jasa</li>
            </ul>
            <button
              onClick={() => setConfirmClear('transactions')}
              disabled={loading === 'transactions'}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg transition-all font-medium"
            >
              {loading === 'transactions' ? 'Memproses...' : 'Kosongkan Transaksi'}
            </button>
          </div>
        </div>

        {/* Clear Master */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">💥</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Kosongkan Semua Data</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Menghapus <strong>semua</strong> data termasuk Master: Produk, Pelanggan, User (kecuali akun Admin saat ini), dan Jasa Service.
              Semua transaksi juga akan ikut terhapus.
            </p>
            <ul className="text-xs text-gray-400 dark:text-gray-500 space-y-1 mb-4">
              <li>✓ Semua data transaksi</li>
              <li>✓ Produk & Kategori</li>
              <li>✓ Pelanggan</li>
              <li>✓ User (kecuali Anda)</li>
              <li>✓ Jasa Service</li>
            </ul>
            <button
              onClick={() => setConfirmClear('master')}
              disabled={loading === 'master'}
              className="w-full py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg transition-all font-medium"
            >
              {loading === 'master' ? 'Memproses...' : 'Kosongkan Semua'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${confirmClear === 'master' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Konfirmasi Hapus Data</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {confirmClear === 'master'
                  ? 'Anda yakin ingin menghapus SEMUA data termasuk master? Tindakan ini tidak dapat dibatalkan!'
                  : 'Anda yakin ingin menghapus semua data transaksi? Data master akan tetap aman.'}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleClear(confirmClear)}
                className={`flex-1 py-2.5 text-white rounded-lg transition-all font-medium ${confirmClear === 'master' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}`}
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setConfirmClear(null)}
                className="flex-1 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
