import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { uploadPhotos, sendWhatsAppNotification } from '../api/api';

export default function Orders() {
  const { id } = useParams();
  const { currentUser, orders, customers, technicians, updateOrder, updateOrderStatus, updateProductStock, addInventoryEntry, addPayment, addOrder, addCustomer, products, services, appSettings } = useApp();
  const [view, setView] = useState('list');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [serviceQty, setServiceQty] = useState({});
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', address: '', phone: '' });
  const [reportDescription, setReportDescription] = useState('');
  const [reportPhotos, setReportPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sparepartQty, setSparepartQty] = useState({});
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

  useEffect(() => {
    if (id) {
      setSelectedOrder(orders.find(o => o.id === parseInt(id)));
      setView('detail');
    }
  }, [id, orders]);

  const filteredOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getStatusColor = (status) => {
    const colors = {
      ORDER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      PROCESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      PENDING: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      OUTSTANDING: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      DONE: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      RESCHEDULE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const handleTechToggle = (techId) => {
    setSelectedTechnicians(prev =>
      prev.includes(techId)
        ? prev.filter(t => t !== techId)
        : [...prev, techId]
    );
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();

    let customer;

    if (showNewCustomer) {
      customer = await addCustomer({
        name: newCustomer.name,
        address: newCustomer.address,
        phone: newCustomer.phone,
      });
    } else {
      customer = customers.find(c => c.id === parseInt(e.target.customerId.value));
    }

    if (!customer) return;

    const form = e.target;
    const orderType = form.type.value;
    const notes = form.notes?.value || '';
    const today = new Date().toISOString().split('T')[0];

    const orderItems = selectedProducts.map(p => ({
      productId: p.id,
      name: p.name,
      qty: parseInt(serviceQty[p.id] || 0) || 1,
      price: p.price
    })).filter(item => item.qty > 0);

    const totalCost = orderItems.reduce((sum, item) => sum + (item.qty * item.price), 0);

    const newOrder = {
      customerId: customer.id,
      customerName: customer.name,
      address: customer.address || '',
      phone: customer.phone || '',
      type: orderType,
      createdAt: today,
      scheduledDate: today,
      notes,
      technicianIds: [],
      items: orderItems,
      totalCost,
      paidAmount: 0,
      paymentMethod: '',
      paymentDate: '',
      report: { description: '', sparesUsed: [] },
      serviceHistory: []
    };

    const createdOrder = await addOrder(newOrder);

    if (appSettings.whatsapp.enabled && appSettings.whatsapp.phoneNumber) {
      sendWhatsAppNotification({
        apiUrl: appSettings.whatsapp.apiUrl,
        apiKey: appSettings.whatsapp.apiKey,
        sessionId: appSettings.whatsapp.sessionId,
        phoneNumber: appSettings.whatsapp.phoneNumber,
        order: createdOrder
      }).catch(() => {});
    }

    setSelectedProducts([]);
    setServiceQty({});
    setNewCustomer({ name: '', address: '', phone: '' });
    setShowNewCustomer(false);

    setView('detail');
    setSelectedOrder(createdOrder);
  };

  const handleAssignTechnician = async (e) => {
    e.preventDefault();
    const form = e.target;
    const scheduleDate = form.scheduleDate.value;
    const notes = form.notes.value;
    const techIds = selectedTechnicians.length > 0 ? selectedTechnicians : [technicians[0]?.id].filter(Boolean);

    await Promise.all([
      updateOrderStatus(selectedOrder.id, 'PROCESS', notes || 'Ditugaskan ke teknisi'),
      updateOrder(selectedOrder.id, {
        technicianIds: techIds,
        scheduledDate: scheduleDate,
        notes
      })
    ]);

    setSelectedOrder(prev => ({
      ...prev,
      scheduledDate: scheduleDate,
      notes,
      technicianIds: techIds,
      status: 'PROCESS',
      serviceHistory: [
        ...(prev.serviceHistory || []),
        {
          status: 'PROCESS',
          date: new Date().toISOString().split('T')[0],
          technician: techIds.map(id => technicians.find(t => t.id === id)?.name || '').join(', '),
          note: `Ditugaskan ke teknisi, jadwal: ${scheduleDate}`
        }
      ]
    }));
  };

  const handleTechnicianReport = async (nextStatus) => {
    if (!reportDescription.trim()) return;

    setUploading(true);
    let photoUrls = [];
    if (reportPhotos.length > 0) {
      try {
        const result = await uploadPhotos(reportPhotos);
        photoUrls = result.urls;
      } catch (err) {
        alert('Gagal upload foto: ' + err.message);
        setUploading(false);
        return;
      }
    }

    const selectedSpares = selectedProducts.filter(p => sparepartQty[p.id] > 0);
    const usedSpares = selectedSpares.map(p => ({
      productId: p.id,
      name: p.name,
      qty: parseInt(sparepartQty[p.id]),
      price: p.price
    }));

    usedSpares.forEach(sp => {
      updateProductStock(sp.productId, sp.qty, 'OUT');
      addInventoryEntry({
        productId: sp.productId,
        type: 'OUT',
        quantity: sp.qty,
        reference: `Order #${selectedOrder.id}`,
        date: new Date().toISOString().split('T')[0],
        note: `Pemakaian sparepart service`
      });
    });

    const sparepartItems = usedSpares.map(sp => ({
      productId: sp.productId,
      name: `${sp.name} (Sparepart)`,
      qty: sp.qty,
      price: sp.price
    }));

    const existingItems = (selectedOrder.items || []).map(i => ({
      productId: i.productId,
      name: i.name,
      qty: i.qty,
      price: i.price
    }));

    const sparepartCost = usedSpares.reduce((sum, sp) => sum + (sp.price * sp.qty), 0);
    const itemsCost = existingItems.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const newTotalCost = itemsCost + sparepartCost;

    const reportData = {
      description: reportDescription,
      sparesUsed: usedSpares
    };
    if (photoUrls.length > 0) reportData.photos = photoUrls;

    await Promise.all([
      updateOrderStatus(selectedOrder.id, nextStatus, reportDescription),
      updateOrder(selectedOrder.id, {
        spareparts: usedSpares,
        totalCost: newTotalCost,
        items: [...existingItems, ...sparepartItems],
        report: reportData
      })
    ]);

    setSelectedOrder(prev => ({
      ...prev,
      status: nextStatus,
      totalCost: newTotalCost,
      items: [...(prev.items || []), ...sparepartItems],
      report: reportData,
      serviceHistory: [
        ...(prev.serviceHistory || []),
        {
          status: nextStatus,
          date: new Date().toISOString().split('T')[0],
          technician: currentUser?.name || 'Teknisi',
          note: nextStatus === 'OUTSTANDING'
            ? `Pekerjaan selesai. ${reportDescription}`
            : `Menunggu sparepart. ${reportDescription}`
        }
      ]
    }));
    setReportDescription('');
    setReportPhotos([]);
    setPhotoPreviews([]);
    setSelectedProducts([]);
    setSparepartQty({});
    setUploading(false);
  };

  const handleCompleteOrder = async (e) => {
    e.preventDefault();
    const totalCost = (selectedOrder.items || []).reduce((sum, i) => sum + (i.price * i.qty), 0);

    const updates = { totalCost };

    if (isPaid) {
      updates.paidAmount = totalCost;
      updates.paymentMethod = paymentMethod;
      updates.paymentDate = paymentDate || new Date().toISOString().split('T')[0];
    }

    await Promise.all([
      updateOrderStatus(selectedOrder.id, 'DONE', 'Order selesai'),
      updateOrder(selectedOrder.id, updates)
    ]);

    if (isPaid) {
      await addPayment({
        orderId: selectedOrder.id,
        amount: totalCost,
        method: paymentMethod,
        date: paymentDate || new Date().toISOString().split('T')[0]
      });
    }

    setView('detail');
    setSelectedOrder(prev => ({ ...prev, ...updates }));
  };

  if (view === 'detail' && selectedOrder) {
    const techNames = selectedOrder.technicianIds
      .map(id => technicians.find(t => t.id === id)?.name || '')
      .filter(Boolean);

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/orders"
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Kembali ke Order</span>
          </Link>
          <div className="h-6 w-px bg-gray-300" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Detail Order #{selectedOrder.id}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Informasi Order</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Buat: {selectedOrder.createdAt}</p>
                </div>
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Customer</span>
                  <span className="font-medium">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Alamat</span>
                  <span className="text-right max-w-md">{selectedOrder.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Phone</span>
                  <span>{selectedOrder.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Jenis</span>
                  <span className="capitalize">{selectedOrder.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Jadwal</span>
                  <span>{selectedOrder.scheduledDate}</span>
                </div>
                {selectedOrder.notes && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Catatan</span>
                    <span className="italic text-gray-600 dark:text-gray-300">{selectedOrder.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Item / Jasa</h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.qty} x {item.price.toLocaleString('id-ID')}</p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {(item.qty * item.price).toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                <span className="font-semibold text-gray-800 dark:text-gray-100">Total</span>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedOrder.totalCost.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Status Pembayaran</h3>
                {selectedOrder.paidAmount > 0 && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 rounded-full text-sm font-medium">
                    Lunas
                  </span>
                )}
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-300">Total Tagihan</span>
                <span className="font-medium">{selectedOrder.totalCost.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-300">Sudah Dibayar</span>
                <span className="font-medium text-green-600">{selectedOrder.paidAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Sisa</span>
                <span className="font-medium text-orange-600">
                  {(selectedOrder.totalCost - selectedOrder.paidAmount).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Report Form (only when PROCESS - technician's job) */}
            {selectedOrder.status === 'PROCESS' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Laporan Teknisi
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Deskripsi Pekerjaan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Jelaskan pekerjaan yang telah dilakukan..."
                    />
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sparepart Digunakan</h4>
                    <div className="space-y-2">
                      {products.filter(p => p.stock > 0).map(product => (
                        <div key={product.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`sparepart_${product.id}`}
                            checked={selectedProducts.includes(product)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts([...selectedProducts, product]);
                              } else {
                                setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
                              }
                            }}
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`sparepart_${product.id}`} className="flex-1">
                            {product.name} - Stok: {product.stock}
                          </label>
                          <input
                            type="number"
                            min="1"
                            disabled={!selectedProducts.includes(product)}
                            value={sparepartQty[product.id] || 0}
                            onChange={(e) => setSparepartQty({ ...sparepartQty, [product.id]: e.target.value })}
                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="Qty"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Foto Pekerjaan <span className="text-gray-400">(opsional, maks. 5)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={uploading}
                      onChange={(e) => {
                        const files = Array.from(e.target.files).slice(0, 5);
                        setReportPhotos(files);
                        setPhotoPreviews(files.map(f => URL.createObjectURL(f)));
                      }}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300"
                    />
                    {photoPreviews.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {photoPreviews.map((url, i) => (
                          <div key={i} className="relative">
                            <img src={url} alt={`Preview ${i+1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600" />
                            <button
                              type="button"
                              onClick={() => {
                                setReportPhotos(prev => prev.filter((_, j) => j !== i));
                                setPhotoPreviews(prev => prev.filter((_, j) => j !== i));
                              }}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {!reportDescription.trim() && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ Isi deskripsi pekerjaan terlebih dahulu sebelum mengubah status
                    </p>
                  )}

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => handleTechnicianReport('OUTSTANDING')}
                      disabled={!reportDescription.trim()}
                      className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                      ✓ Selesai — Tunggu Pembayaran
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTechnicianReport('PENDING')}
                      disabled={!reportDescription.trim()}
                      className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                      ⏳ Tunggu Sparepart
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Report Display (after technician submitted) */}
            {selectedOrder.report?.description && selectedOrder.status !== 'PROCESS' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Laporan Teknisi</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{selectedOrder.report.description}</p>
                {selectedOrder.report?.photos?.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {selectedOrder.report.photos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Foto ${i+1}`} className="w-28 h-28 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Payment Form (OUTSTANDING or PENDING - admin handles payment) */}
            {(selectedOrder.status === 'OUTSTANDING' || selectedOrder.status === 'PENDING') && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Form Pembayaran</h3>
                <form onSubmit={handleCompleteOrder} className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isPaid}
                        onChange={(e) => setIsPaid(e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lunas</span>
                    </label>
                  </div>

                  {isPaid && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Metode Pembayaran
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          <option value="">Pilih metode</option>
                          <option value="tunai">Tunai</option>
                          <option value="transfer">Transfer</option>
                          <option value="qris">QRIS</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tanggal Pembayaran
                        </label>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                  >
                    {isPaid ? 'Konfirmasi Pembayaran' : 'Simpan Pembayaran (Belum Lunas)'}
                  </button>
                </form>
              </div>
            )}

            {/* Service History Timeline */}
            {selectedOrder.serviceHistory && selectedOrder.serviceHistory.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Timeline Histori</h3>
                <div className="space-y-4 relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-300"></div>
                  {selectedOrder.serviceHistory.map((history, idx) => (
                    <div key={idx} className="relative flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`font-semibold ${
                            history.status === 'DONE' ? 'text-green-600' :
                            history.status === 'PROCESS' ? 'text-yellow-600' :
                            history.status === 'ORDER' ? 'text-blue-600' :
                            'text-gray-600 dark:text-gray-300'
                          }`}>
                            {history.status}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{history.date}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{history.note}</p>
                        {history.technician && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Teknisi: {history.technician}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tech Assignment Panel */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                {selectedOrder.status === 'ORDER' ? 'Penugasan Teknisi' : 'Status Sekarang'}
              </h3>
              {selectedOrder.status === 'ORDER' ? (
                <form onSubmit={handleAssignTechnician} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pilih Teknisi
                    </label>
                    <div className="space-y-2">
                      {technicians.map(tech => (
                        <label key={tech.id} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedTechnicians.includes(tech.id)}
                            onChange={() => handleTechToggle(tech.id)}
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="flex-1 text-sm">{tech.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{tech.phone}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Jadwal Service
                    </label>
                    <input
                      type="date"
                      name="scheduleDate"
                      required
                      defaultValue={selectedOrder.scheduledDate}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Catatan
                    </label>
                    <textarea
                      name="notes"
                      rows={3}
                      placeholder="Catatan tambahan..."
                      defaultValue={selectedOrder.notes}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Assign & Proses Order
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Teknisi Penanggung Jawab</p>
                    <p className="font-medium">{techNames.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Status</p>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Order Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Aksi Order</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setView('list')}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
                >
                  Kembali ke Daftar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Order Service</h2>
          <p className="text-gray-500 dark:text-gray-400">Kelola semua order service AC</p>
        </div>
        <button
          onClick={() => setView('new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Buat Order Baru</span>
        </button>
      </div>

      {view === 'new' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Buat Order Baru</h3>
          <form onSubmit={handleAddOrder} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Customer
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowNewCustomer(!showNewCustomer); setNewCustomer({ name: '', address: '', phone: '' }); }}
                    className={`text-xs font-medium px-3 py-1 rounded-lg transition-all ${
                      showNewCustomer
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-100'
                    }`}
                  >
                    {showNewCustomer ? 'Pilih Existing' : '+ Customer Baru'}
                  </button>
                </div>

                {showNewCustomer ? (
                  <div className="space-y-3 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 mb-1">
                      <span className="text-base">🆕</span> Data customer baru
                    </div>
                    <input
                      type="text"
                      placeholder="Nama customer"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Alamat"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <input
                      type="text"
                      placeholder="Nomor telepon"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    />
                  </div>
                ) : (
                  <select
                    name="customerId"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Pilih customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Jenis Order
                </label>
                <select
                  name="type"
                  required
                  defaultValue="service"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="service">Service</option>
                  <option value="sales">Penjualan Langsung</option>
                </select>
              </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Foto Pekerjaan (maks. 5)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={uploading}
                      onChange={(e) => {
                        const files = Array.from(e.target.files).slice(0, 5);
                        setReportPhotos(files);
                        setPhotoPreviews(files.map(f => URL.createObjectURL(f)));
                      }}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300"
                    />
                    {photoPreviews.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {photoPreviews.map((url, i) => (
                          <div key={i} className="relative">
                            <img src={url} alt={`Preview ${i+1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600" />
                            <button
                              type="button"
                              onClick={() => {
                                setReportPhotos(prev => prev.filter((_, j) => j !== i));
                                setPhotoPreviews(prev => prev.filter((_, j) => j !== i));
                              }}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Produk / Jasa
              </label>
              <div className="space-y-2">
                {products.map(product => (
                  <div key={product.id} className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <input
                      type="checkbox"
                      id={`product_${product.id}`}
                      checked={selectedProducts.includes(product)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, product]);
                        } else {
                          setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
                        }
                      }}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`product_${product.id}`} className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Stok: {product.stock} | Harga: {product.price.toLocaleString('id-ID')}</p>
                    </label>
                    <input
                      type="number"
                      min="1"
                      disabled={!selectedProducts.includes(product)}
                      name={`product_${product.id}`}
                      value={serviceQty[product.id] || 0}
                      onChange={(e) => setServiceQty({ ...serviceQty, [product.id]: e.target.value })}
                      className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Qty"
                    />
                  </div>
                ))}
                {services.map(service => (
                  <div key={service.id} className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <input
                      type="checkbox"
                      id={`service_${service.id}`}
                      checked={selectedProducts.find(p => p.name === service.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, service]);
                        } else {
                          setSelectedProducts(selectedProducts.filter(p => p.name !== service.name));
                        }
                      }}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`service_${service.id}`} className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{service.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Harga: {service.price.toLocaleString('id-ID')}</p>
                    </label>
                    <input
                      type="number"
                      min="1"
                      disabled={!selectedProducts.find(p => p.name === service.name)}
                      value={serviceQty[service.id] || 0}
                      onChange={(e) => setServiceQty({ ...serviceQty, [service.id]: e.target.value })}
                      className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Qty"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Catatan
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Deskripsi keluhan / permintaan..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                Buat Order
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Daftar Order</h3>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Cari order..."
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Jenis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Jadwal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 capitalize">
                    {order.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {order.totalCost.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === 'ORDER' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                      order.status === 'PROCESS' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                      order.status === 'PENDING' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                      order.status === 'OUTSTANDING' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
                      order.status === 'DONE' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {order.scheduledDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
