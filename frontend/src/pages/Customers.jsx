import { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const defaultForm = { name: '', address: '', phone: '' };

function getStatusColor(status) {
  const colors = {
    ORDER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    PROCESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    PENDING: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    OUTSTANDING: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    DONE: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    RESCHEDULE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export default function Customers() {
  const { customers, orders, addCustomer, updateCustomer, deleteCustomer, users } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [error, setError] = useState('');

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const openAdd = () => {
    setEditingCustomer(null);
    setFormData(defaultForm);
    setError('');
    setShowForm(true);
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      address: customer.address || '',
      phone: customer.phone || '',
    });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const duplicate = customers.find(c =>
      c.id !== (editingCustomer?.id ?? -1) &&
      c.name.toLowerCase().trim() === formData.name.toLowerCase().trim() &&
      c.phone.trim() === formData.phone.trim()
    );
    if (duplicate) {
      setError(`Pelanggan dengan nama "${formData.name}" dan nomor "${formData.phone}" sudah terdaftar.`);
      return;
    }
    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, formData);
    } else {
      await addCustomer(formData);
    }
    setShowForm(false);
    setEditingCustomer(null);
    setFormData(defaultForm);
    setError('');
  };

  const handleDelete = async (id) => {
    await deleteCustomer(id);
    setDeleteConfirm(null);
  };

  const customerOrders = selectedCustomer
    ? orders.filter(o => o.customerId === selectedCustomer.id)
    : [];

  if (selectedCustomer) {
    const totalSpent = customerOrders.reduce((sum, o) => sum + o.totalCost, 0);
    const completedOrders = customerOrders.filter(o => o.status === 'DONE');

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedCustomer(null)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Kembali</span>
          </button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Riwayat Service</h2>
        </div>

        {/* Customer Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-xl font-bold text-white">
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{selectedCustomer.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedCustomer.phone || '-'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedCustomer.address || '-'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Bergabung</p>
              <p className="font-medium text-gray-800 dark:text-gray-100">{selectedCustomer.joinDate || '-'}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Service</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{customerOrders.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Selesai</p>
            <p className="text-2xl font-bold text-green-600">{completedOrders.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Aktif</p>
            <p className="text-2xl font-bold text-blue-600">{customerOrders.length - completedOrders.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Pembelanjaan</p>
            <p className="text-2xl font-bold text-purple-600">{totalSpent.toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* Orders List */}
        {customerOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-lg">Belum ada riwayat service</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Pelanggan ini belum pernah melakukan order</p>
          </div>
        ) : (
          customerOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(order => (
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              {/* Order Header */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-mono font-bold text-gray-800 dark:text-gray-100">Order #{order.id}</span>
                  <span className={`px-3 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>{order.type === 'service' ? 'Service' : 'Penjualan'}</span>
                  <span>{order.createdAt}</span>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Order Items */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Item / Jasa</h4>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.qty} x {item.price.toLocaleString('id-ID')}</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {(item.qty * item.price).toLocaleString('id-ID')}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
                      <span className="text-base font-bold text-gray-900 dark:text-gray-100">{order.totalCost.toLocaleString('id-ID')}</span>
                    </div>

                    {/* Spareparts used */}
                    {order.report?.sparesUsed?.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Sparepart Digunakan</h5>
                        <div className="space-y-1">
                          {order.report.sparesUsed.map((sp, idx) => (
                            <p key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                              {sp.name} — {sp.qty} x {sp.price.toLocaleString('id-ID')}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Service History Timeline */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Riwayat Progress</h4>
                    {order.serviceHistory && order.serviceHistory.length > 0 ? (
                      <div className="space-y-3 relative">
                        <div className="absolute left-3.5 top-1 bottom-1 w-px bg-gray-300 dark:bg-gray-600" />
                        {order.serviceHistory.map((h, idx) => (
                          <div key={idx} className="relative flex items-start space-x-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 z-10 ${
                              h.status === 'DONE' ? 'bg-green-500' :
                              h.status === 'PROCESS' ? 'bg-yellow-500' :
                              h.status === 'ORDER' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs font-semibold ${
                                  h.status === 'DONE' ? 'text-green-600' :
                                  h.status === 'PROCESS' ? 'text-yellow-600' :
                                  'text-blue-600'
                                }`}>{h.status}</span>
                                <span className="text-xs text-gray-400">{h.date}</span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{h.note}</p>
                              {h.technician && (
                                <p className="text-xs text-gray-400 mt-0.5">Teknisi: {h.technician}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Belum ada riwayat progress</p>
                    )}

                    {/* Report Description */}
                    {order.report?.description && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Laporan Teknisi:</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">{order.report.description}</p>
                        {order.report?.photos?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {order.report.photos.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt={`Foto ${i+1}`} className="w-16 h-16 object-cover rounded border border-blue-200 hover:opacity-80 transition-opacity" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Info */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {order.paidAmount > 0 ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        ✓ Lunas — {order.paidAmount.toLocaleString('id-ID')} ({order.paymentMethod})
                      </span>
                    ) : (
                      <span className="text-red-500 font-medium">Belum dibayar</span>
                    )}
                  </div>
                  {order.technicianIds?.length > 0 && (
                    <div className="text-xs text-gray-400">
                      Teknisi: {order.technicianIds.map(id => {
                        const u = users.find(u => u.id === id);
                        return u?.name;
                      }).filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Data Pelanggan</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola data pelanggan AirCool</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Tambah Pelanggan</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Pelanggan</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{customers.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Order</p>
          <p className="text-2xl font-bold text-blue-600">
            {customers.reduce((sum, c) => sum + (c._count?.orders || 0), 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Terdaftar</p>
          <p className="text-2xl font-bold text-green-600">
            {customers.filter(c => c.joinDate).length}
          </p>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Daftar Pelanggan</h3>
          <input
            type="text"
            placeholder="Cari nama atau telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Telepon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Alamat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bergabung</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    {search ? 'Tidak ada pelanggan yang cocok' : 'Belum ada data pelanggan'}
                  </td>
                </tr>
              )}
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{customer.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{customer.address || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{customer.joinDate || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all text-xs"
                      >
                        Riwayat
                      </button>
                      <button
                        onClick={() => openEdit(customer)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-all text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(customer)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-all text-xs"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
              </h3>
              <button
                onClick={() => { setShowForm(false); setEditingCustomer(null); setError(''); }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Nama pelanggan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nomor Telepon</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="08123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Alamat</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jl. Contoh No. 123, Jakarta"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                >
                  {editingCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingCustomer(null); setError(''); }}
                  className="flex-1 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium"
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Hapus Pelanggan</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Apakah Anda yakin ingin menghapus <strong>{deleteConfirm.name}</strong>?
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
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
    </div>
  );
}
